import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const snapshotSchema = z.object({
  sessionId: z.string().cuid("ID de sessão inválido"),
  label: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only practitioners can create snapshots
    if (session.role !== "PRACTITIONER" && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = snapshotSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, label, notes } = result.data;

    // Verify session belongs to practitioner
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { practitioner: true },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessionData.practitioner.userId !== session.userId && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get latest scene state
    const latestEvent = await prisma.sceneEvent.findFirst({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    // Get all entities from events
    const events = await prisma.sceneEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
    });

    // Create snapshot
    const snapshot = await prisma.sceneSnapshot.create({
      data: {
        sessionId,
        label: label || `Snapshot ${new Date().toLocaleString("pt-BR")}`,
        notes,
        sceneData: {
          entities: latestEvent?.payload || {},
          version: events.length,
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "SNAPSHOT_CREATE",
        entityType: "SceneSnapshot",
        entityId: snapshot.id,
        payload: { sessionId },
      },
    });

    return NextResponse.json({ snapshot }, { status: 201 });
  } catch (error) {
    console.error("Create snapshot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get session to verify access
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { practitioner: true },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access
    const canAccess =
      session.role === "PLATFORM_ADMIN" ||
      sessionData.practitioner.userId === session.userId;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshots = await prisma.sceneSnapshot.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Get snapshots error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
