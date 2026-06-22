import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const practitioner = await prisma.practitionerProfile.findUnique({
      where: { userId: session.userId },
    });

    if (!practitioner) {
      return NextResponse.json({ error: "Practitioner not found" }, { status: 404 });
    }

    const clients = await prisma.clientProfile.findMany({
      where: {
        user: {
          tenantId: session.tenantId,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
            lastLoginAt: true,
          },
        },
        appointments: {
          where: {
            practitionerId: practitioner.id,
          },
          orderBy: { requestedAt: "desc" },
          take: 5,
        },
      },
      orderBy: { user: { createdAt: "desc" } },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Get clients error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
