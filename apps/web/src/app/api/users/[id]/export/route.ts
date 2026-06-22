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

    // Get user to check ownership
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check access
    const canExport =
      session.role === "PLATFORM_ADMIN" ||
      (session.tenantId === user.tenantId && session.userId === id);

    if (!canExport) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Gather user data
    const [userData, sessions, payments, acceptances] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.session.findMany({
        where: { practitioner: { userId: id } },
        select: {
          id: true,
          title: true,
          status: true,
          startsAt: true,
        },
      }),
      prisma.payment.findMany({
        where: { session: { practitioner: { userId: id } } },
        select: {
          id: true,
          amountCents: true,
          status: true,
          createdAt: true,
        },
      }),
      prisma.consentAcceptance.findMany({
        where: { userId: id },
        select: {
          id: true,
          acceptedAt: true,
          term: { select: { title: true } },
        },
      }),
    ]);

    return NextResponse.json({
      user: userData,
      sessions,
      payments,
      consents: acceptances,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Export data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
