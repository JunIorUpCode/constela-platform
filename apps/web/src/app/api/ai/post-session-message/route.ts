import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { generatePostSessionMessage } from "@/lib/session-summary-service";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only practitioners can generate post-session messages
    if (session.role !== "PRACTITIONER" && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId, clientName } = body;

    if (!sessionId || !clientName) {
      return NextResponse.json(
        { error: "Session ID and client name are required" },
        { status: 400 }
      );
    }

    const result = await generatePostSessionMessage({
      sessionId,
      clientName,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error("Generate post-session message API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
