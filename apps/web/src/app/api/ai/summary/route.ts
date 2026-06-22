import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { generateSessionSummary } from "@/lib/session-summary-service";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only practitioners can generate summaries
    if (session.role !== "PRACTITIONER" && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const result = await generateSessionSummary({
      sessionId,
      practitionerId: session.userId,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ summary: result.summary });
  } catch (error) {
    console.error("Generate summary API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
