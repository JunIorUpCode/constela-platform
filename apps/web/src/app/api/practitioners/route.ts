import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {
      publicProfile: true,
      user: {
        isActive: true,
        role: "PRACTITIONER",
      },
    };

    if (search) {
      where.user = {
        ...(where.user as Record<string, unknown>),
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      };
    }

    const [practitioners, total] = await Promise.all([
      prisma.practitionerProfile.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { user: { createdAt: "desc" } },
      }),
      prisma.practitionerProfile.count({ where }),
    ]);

    return NextResponse.json({
      practitioners,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + practitioners.length < total,
      },
    });
  } catch (error) {
    console.error("Get practitioners error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
