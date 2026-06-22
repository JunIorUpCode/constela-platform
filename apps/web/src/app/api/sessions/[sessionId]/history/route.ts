import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;

    // Get session with full history
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        practitioner: {
          include: { user: true },
        },
        participants: {
          include: { user: true },
        },
        sceneEvents: {
          orderBy: { createdAt: "asc" },
        },
        sceneSnapshots: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access
    const isPractitioner = sessionData.practitioner.userId === session.userId;
    const isParticipant = sessionData.participants.some((p) => p.userId === session.userId);
    const canAccess = session.role === "PLATFORM_ADMIN" || isPractitioner || isParticipant;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build timeline
    const timeline = buildTimeline(sessionData.sceneEvents, sessionData.sceneSnapshots);

    return NextResponse.json({
      session: {
        id: sessionData.id,
        title: sessionData.title,
        status: sessionData.status,
        startsAt: sessionData.startsAt,
        endsAt: sessionData.endsAt,
        notes: sessionData.notes,
        practitioner: {
          name: sessionData.practitioner.user.name,
        },
        participants: sessionData.participants.map((p) => ({
          name: p.user.name,
          role: p.role,
        })),
      },
      timeline,
      snapshots: isPractitioner || session.role === "PLATFORM_ADMIN"
        ? sessionData.sceneSnapshots
        : [],
      eventCount: sessionData.sceneEvents.length,
    });
  } catch (error) {
    console.error("Get session history error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildTimeline(events: any[], snapshots: any[]) {
  const timeline: Array<{
    id: string;
    type: "event" | "snapshot";
    eventType?: string;
    label: string;
    timestamp: Date;
    data?: any;
  }> = [];

  // Add events
  for (const event of events) {
    timeline.push({
      id: event.id,
      type: "event",
      eventType: event.eventType,
      label: getEventLabel(event.eventType),
      timestamp: event.createdAt,
      data: event.payload,
    });
  }

  // Add snapshots
  for (const snapshot of snapshots) {
    timeline.push({
      id: snapshot.id,
      type: "snapshot",
      label: snapshot.label || "Snapshot",
      timestamp: snapshot.createdAt,
      data: snapshot.sceneData,
    });
  }

  // Sort by timestamp
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return timeline;
}

function getEventLabel(eventType: string): string {
  const labels: Record<string, string> = {
    ENTITY_ADD: "Adicionou elemento",
    ENTITY_MOVE: "Moveu elemento",
    ENTITY_REMOVE: "Removeu elemento",
    PERMISSION_CHANGE: "Alterou permissão",
    CAMERA_CHANGE: "Mudou câmera",
    SESSION_START: "Iniciou sessão",
    SESSION_END: "Encerrou sessão",
    NOTE: "Anotação",
  };

  return labels[eventType] || eventType;
}
