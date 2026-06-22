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

    // Get session
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { practitioner: true },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant = await prisma.sessionParticipant.findFirst({
      where: {
        sessionId,
        userId: session.userId,
      },
    });

    // Check access
    const canJoin =
      session.role === "PLATFORM_ADMIN" ||
      sessionData.practitioner.userId === session.userId ||
      isParticipant;

    if (!canJoin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check session status
    if (sessionData.status !== "READY" && sessionData.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Session is not ready to join" },
        { status: 400 }
      );
    }

    // Update participant join time
    if (isParticipant) {
      await prisma.sessionParticipant.update({
        where: { id: isParticipant.id },
        data: { joinedAt: new Date() },
      });
    }

    return NextResponse.json({
      canJoin: true,
      session: {
        id: sessionData.id,
        title: sessionData.title,
        status: sessionData.status,
      },
    });
  } catch (error) {
    console.error("Join session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
