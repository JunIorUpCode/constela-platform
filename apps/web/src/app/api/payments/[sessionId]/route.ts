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

    const payment = await prisma.payment.findUnique({
      where: { sessionId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Get session to check access
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { practitioner: true },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    const canAccess =
      session.role === "PLATFORM_ADMIN" ||
      sessionData.practitioner.userId === session.userId;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error("Get payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
