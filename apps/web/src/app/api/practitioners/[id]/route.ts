import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const practitioner = await prisma.practitionerProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
        sessions: {
          where: {
            status: { in: ["COMPLETED"] },
          },
          select: {
            id: true,
            startsAt: true,
            endsAt: true,
          },
          orderBy: { startsAt: "desc" },
          take: 10,
        },
      },
    });

    if (!practitioner) {
      return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
    }

    // Check if profile is public
    if (!practitioner.publicProfile) {
      // Check if requester is the practitioner themselves
      const session = await getCurrentSession();
      if (!session || session.userId !== practitioner.userId) {
        return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
      }
    }

    return NextResponse.json({ practitioner });
  } catch (error) {
    console.error("Get practitioner error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const practitioner = await prisma.practitionerProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!practitioner) {
      return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
    }

    // Only practitioner can update own profile
    if (practitioner.userId !== session.userId && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const updated = await prisma.practitionerProfile.update({
      where: { id },
      data: {
        bio: body.bio,
        sessionPrice: body.sessionPrice,
        sessionDuration: body.sessionDuration,
        avatarUrl: body.avatarUrl,
        publicProfile: body.publicProfile,
      },
    });

    return NextResponse.json({ practitioner: updated });
  } catch (error) {
    console.error("Update practitioner error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
