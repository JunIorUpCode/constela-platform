import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@constela/db";
import {
  createLiveKitToken,
  generateRoomName,
  getLiveKitUrl,
} from "@/lib/livekit";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get session data
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        practitioner: {
          include: { user: true },
        },
        participants: {
          where: { userId: session.userId },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access
    const isPractitioner = sessionData.practitioner.userId === session.userId;
    const isParticipant = sessionData.participants.length > 0;

    if (!isPractitioner && !isParticipant && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check session status
    if (sessionData.status !== "READY" && sessionData.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Session is not ready for video" },
        { status: 400 }
      );
    }

    // Determine role
    let role: "host" | "guest" | "observer" = "guest";
    if (isPractitioner || session.role === "PLATFORM_ADMIN") {
      role = "host";
    } else if (session.role === "OBSERVER") {
      role = "observer";
    }

    // Generate room name
    const roomName = generateRoomName(sessionId);

    // Create token
    const token = await createLiveKitToken({
      roomName,
      participantName: session.name,
      participantIdentity: session.userId,
      role,
    });

    return NextResponse.json({
      token,
      roomName,
      livekitUrl: getLiveKitUrl(),
    });
  } catch (error) {
    console.error("LiveKit token error:", error);
    return NextResponse.json(
      { error: "Failed to create LiveKit token" },
      { status: 500 }
    );
  }
}
