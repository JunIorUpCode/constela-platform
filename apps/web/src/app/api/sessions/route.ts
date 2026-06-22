import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const createSessionSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().optional(),
  type: z.enum(["INDIVIDUAL", "GROUP_CLOSED", "GROUP_WITH_OBSERVERS", "DEMONSTRATION"]),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  priceCents: z.number().int().positive().optional(),
  participantIds: z.array(z.string()).optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const practitionerId = searchParams.get("practitionerId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const where: Record<string, unknown> = {};

    // Filter by tenant
    if (session.tenantId) {
      where.tenantId = session.tenantId;
    }

    // Filter by role
    if (session.role === "PRACTITIONER") {
      where.practitionerId = session.userId;
    } else if (session.role === "CLIENT") {
      where.participants = {
        some: { userId: session.userId },
      };
    }

    // Additional filters
    if (status) where.status = status;
    if (practitionerId) where.practitionerId = practitionerId;
    if (from || to) {
      where.startsAt = {};
      if (from) (where.startsAt as Record<string, Date>).gte = new Date(from);
      if (to) (where.startsAt as Record<string, Date>).lte = new Date(to);
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        practitioner: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        payment: true,
      },
      orderBy: { startsAt: "asc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Get sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only practitioners can create sessions
    if (session.role !== "PRACTITIONER" && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = createSessionSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { title, description, type, startsAt, endsAt, priceCents, participantIds } = result.data;

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

    // Create session
    const newSession = await prisma.session.create({
      data: {
        tenantId: session.tenantId!,
        practitionerId: practitionerProfile.id,
        title,
        description,
        type,
        status: "DRAFT",
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        priceCents: priceCents || practitionerProfile.sessionPrice || null,
      },
      include: {
        practitioner: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    // Add participants if provided
    if (participantIds && participantIds.length > 0) {
      await prisma.sessionParticipant.createMany({
        data: participantIds.map((userId) => ({
          sessionId: newSession.id,
          userId,
          role: "CLIENT",
        })),
      });
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "SESSION_CREATE",
        entityType: "Session",
        entityId: newSession.id,
      },
    });

    return NextResponse.json({ session: newSession }, { status: 201 });
  } catch (error) {
    console.error("Create session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
