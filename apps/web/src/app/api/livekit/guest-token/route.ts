import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { createLiveKitToken, generateRoomName } from "@/lib/livekit";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, name: guestName, email: guestEmail } = body;

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
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Only practitioner can create guest tokens
    if (sessionData.practitioner.userId !== session.userId && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check session status
    if (sessionData.status !== "READY" && sessionData.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Session is not ready for video" },
        { status: 400 }
      );
    }

    // Generate a guest identity if not provided
    const guestIdentity = guestEmail || `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const guestDisplayName = guestName || "Convidado";

    // Generate room name
    const roomName = generateRoomName(sessionId);

    // Create token for guest
    const token = await createLiveKitToken({
      roomName,
      participantName: guestDisplayName,
      participantIdentity: guestIdentity,
      role: "guest",
    });

    return NextResponse.json({
      token,
      roomName,
    });
  } catch (error) {
    console.error("Create guest token error:", error);
    return NextResponse.json(
      { error: "Failed to create guest token" },
      { status: 500 }
    );
  }
}
