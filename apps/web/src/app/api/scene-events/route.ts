import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const eventSchema = z.object({
  sessionId: z.string().cuid("ID de sessão inválido"),
  eventType: z.enum([
    "ENTITY_ADD",
    "ENTITY_MOVE",
    "ENTITY_REMOVE",
    "PERMISSION_CHANGE",
    "CAMERA_CHANGE",
    "SESSION_START",
    "SESSION_END",
    "NOTE",
  ]),
  payload: z.record(z.unknown()).optional(),
  version: z.number().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only practitioners can create events
    if (session.role !== "PRACTITIONER" && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = eventSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, eventType, payload, version } = result.data;

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

    // Create event
    const event = await prisma.sceneEvent.create({
      data: {
        sessionId,
        eventType,
        payload: payload || {},
        version: version || 1,
        createdBy: session.userId,
      },
    });

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    console.error("Create scene event error:", error);
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
    const limit = parseInt(searchParams.get("limit") || "100");
    const offset = parseInt(searchParams.get("offset") || "0");

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

    const [events, total] = await Promise.all([
      prisma.sceneEvent.findMany({
        where: { sessionId },
        orderBy: { createdAt: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.sceneEvent.count({ where: { sessionId } }),
    ]);

    return NextResponse.json({
      events,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + events.length < total,
      },
    });
  } catch (error) {
    console.error("Get scene events error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
