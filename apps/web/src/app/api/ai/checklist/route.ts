import { NextResponse } from "next/server";
import { generatePreparationChecklist } from "@/lib/session-summary-service";

export async function GET() {
  try {
    const result = await generatePreparationChecklist();

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ checklist: result.checklist });
  } catch (error) {
    console.error("Generate checklist API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
