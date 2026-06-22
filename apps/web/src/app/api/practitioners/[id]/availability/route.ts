import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get practitioner
    const practitioner = await prisma.practitionerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        availability: {
          where: { isActive: true },
          orderBy: { dayOfWeek: "asc" },
        },
      },
    });

    if (!practitioner) {
      return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
    }

    // Get booked slots for the next 30 days
    const fromDate = new Date();
    const toDate = new Date();
    toDate.setDate(toDate.getDate() + 30);

    const bookedSessions = await prisma.session.findMany({
      where: {
        practitionerId: id,
        status: { in: ["SCHEDULED", "AWAITING_PAYMENT", "PAID", "READY", "IN_PROGRESS"] },
        startsAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
    });

    return NextResponse.json({
      practitioner: {
        id: practitioner.id,
        name: practitioner.user.name,
        email: practitioner.user.email,
        sessionPrice: practitioner.sessionPrice,
        sessionDuration: practitioner.sessionDuration,
        availability: practitioner.availability,
      },
      bookedSlots: bookedSessions,
    });
  } catch (error) {
    console.error("Get availability error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
