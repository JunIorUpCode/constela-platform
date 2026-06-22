import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const endSessionSchema = z.object({
  notes: z.string().optional(),
});

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

    // Validate status
    if (existingSession.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Session is not in progress" },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const result = endSessionSchema.safeParse(body);

    // Update session status
    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: "COMPLETED",
        notes: result.success ? body.notes : undefined,
      },
    });

    // Record scene end event
    await prisma.sceneEvent.create({
      data: {
        sessionId: id,
        eventType: "SESSION_END",
        payload: {
          endedBy: session.userId,
          endedAt: new Date().toISOString(),
          notes: result.success ? body.notes : null,
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
        action: "SESSION_END",
        entityType: "Session",
        entityId: id,
      },
    });

    return NextResponse.json({
      session: updatedSession,
      message: "Session completed",
    });
  } catch (error) {
    console.error("End session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
