import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const blockSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  reason: z.string().optional(),
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

    const blocks = await prisma.availabilityBlock.findMany({
      where: {
        practitionerId: practitionerProfile.id,
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: "asc" },
    });

    return NextResponse.json({ blocks });
  } catch (error) {
    console.error("Get blocks error:", error);
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
    const result = blockSchema.safeParse(body);

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

    const { startDate, endDate, reason } = result.data;

    // Create block
    const block = await prisma.availabilityBlock.create({
      data: {
        practitionerId: practitionerProfile.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
    });

    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    console.error("Create block error:", error);
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
    const blockId = searchParams.get("id");

    if (!blockId) {
      return NextResponse.json({ error: "Block ID required" }, { status: 400 });
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

    // Delete block
    await prisma.availabilityBlock.deleteMany({
      where: {
        id: blockId,
        practitionerId: practitionerProfile.id,
      },
    });

    return NextResponse.json({ message: "Block deleted" });
  } catch (error) {
    console.error("Delete block error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
