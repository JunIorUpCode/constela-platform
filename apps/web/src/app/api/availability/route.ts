import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const availabilityRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato: HH:mm"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato: HH:mm"),
});

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get practitioner profile
    const practitionerProfile = await prisma.practitionerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!practitionerProfile) {
      return NextResponse.json(
        { error: "Practitioner profile not found" },
        { status: 404 }
      );
    }

    const rules = await prisma.availabilityRule.findMany({
      where: {
        practitionerId: practitionerProfile.id,
        isActive: true,
      },
      orderBy: { dayOfWeek: "asc" },
    });

    return NextResponse.json({ availability: rules });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "PRACTITIONER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = availabilityRuleSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    // Get practitioner profile
    const practitionerProfile = await prisma.practitionerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!practitionerProfile) {
      return NextResponse.json(
        { error: "Practitioner profile not found" },
        { status: 404 }
      );
    }

    const { dayOfWeek, startTime, endTime } = result.data;

    // Validate time range
    if (startTime >= endTime) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    // Create or update rule
    const rule = await prisma.availabilityRule.upsert({
      where: {
        practitionerId_dayOfWeek: {
          practitionerId: practitionerProfile.id,
          dayOfWeek,
        },
      },
      update: {
        startTime,
        endTime,
        isActive: true,
      },
      create: {
        practitionerId: practitionerProfile.id,
        dayOfWeek,
        startTime,
        endTime,
        isActive: true,
      },
    });

    return NextResponse.json({ availability: rule }, { status: 201 });
  } catch (error) {
    console.error("Create availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "PRACTITIONER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const ruleId = searchParams.get("id");

    if (!ruleId) {
      return NextResponse.json({ error: "Rule ID required" }, { status: 400 });
    }

    // Get practitioner profile
    const practitionerProfile = await prisma.practitionerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!practitionerProfile) {
      return NextResponse.json(
        { error: "Practitioner profile not found" },
        { status: 404 }
      );
    }

    // Delete rule
    await prisma.availabilityRule.deleteMany({
      where: {
        id: ruleId,
        practitionerId: practitionerProfile.id,
      },
    });

    return NextResponse.json({ message: "Rule deleted" });
  } catch (error) {
    console.error("Delete availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
