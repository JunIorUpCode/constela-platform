import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const updateSessionSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "GROUP_CLOSED", "GROUP_WITH_OBSERVERS", "DEMONSTRATION"]).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  priceCents: z.number().int().positive().nullable().optional(),
  notes: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const sessionData = await prisma.session.findUnique({
      where: { id },
      include: {
        practitioner: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        sceneEvents: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
        sceneSnapshots: {
          orderBy: { createdAt: "desc" },
        },
        payment: true,
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access
    const canAccess =
      session.role === "PLATFORM_ADMIN" ||
      sessionData.practitioner.userId === session.userId ||
      sessionData.participants.some((p) => p.userId === session.userId);

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ session: sessionData });
  } catch (error) {
    console.error("Get session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
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

    // Check permission
    if (
      session.role !== "PLATFORM_ADMIN" &&
      existingSession.practitioner.userId !== session.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = updateSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, type, startsAt, endsAt, priceCents, notes } = result.data;

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(type && { type }),
        ...(startsAt && { startsAt: new Date(startsAt) }),
        ...(endsAt && { endsAt: new Date(endsAt) }),
        ...(priceCents !== undefined && { priceCents }),
        ...(notes !== undefined && { notes }),
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "SESSION_UPDATE",
        entityType: "Session",
        entityId: id,
      },
    });

    return NextResponse.json({ session: updatedSession });
  } catch (error) {
    console.error("Update session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
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

    // Check permission
    if (
      session.role !== "PLATFORM_ADMIN" &&
      existingSession.practitioner.userId !== session.userId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Only allow delete for non-started sessions
    if (existingSession.status === "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Cannot delete session in progress" },
        { status: 400 }
      );
    }

    await prisma.session.delete({ where: { id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "SESSION_DELETE",
        entityType: "Session",
        entityId: id,
      },
    });

    return NextResponse.json({ message: "Session deleted" });
  } catch (error) {
    console.error("Delete session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
