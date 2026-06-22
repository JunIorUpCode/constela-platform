import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get existing session
    const existingSession = await prisma.session.findUnique({
      where: { id },
      include: {
        practitioner: true,
        participants: true,
        consentAcceptances: true,
        payment: true,
      },
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check permission - only practitioner or platform admin
    if (
      session.role !== "PLATFORM_ADMIN" &&
      existingSession.practitioner.userId !== session.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      DRAFT: ["SCHEDULED"],
      SCHEDULED: ["READY", "CANCELED"],
      READY: ["IN_PROGRESS", "CANCELED"],
    };

    if (!validTransitions[existingSession.status]?.includes("IN_PROGRESS")) {
      return NextResponse.json(
        { error: `Cannot start session from status ${existingSession.status}` },
        { status: 400 }
      );
    }

    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: "IN_PROGRESS",
      },
    });

    // Record scene start event
    await prisma.sceneEvent.create({
      data: {
        sessionId: id,
        eventType: "SESSION_START",
        payload: {
          startedBy: session.userId,
          startedAt: new Date().toISOString(),
        },
        version: 1,
        createdBy: session.userId,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "SESSION_START",
        entityType: "Session",
        entityId: id,
      },
    });

    return NextResponse.json({
      session: updatedSession,
      message: "Session started",
    });
  } catch (error) {
    console.error("Start session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
