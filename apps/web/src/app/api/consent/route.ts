import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const acceptSchema = z.object({
  termId: z.string(),
});

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const acceptances = await prisma.consentAcceptance.findMany({
      where: { userId: session.userId },
      include: { term: true },
      orderBy: { acceptedAt: "desc" },
    });

    return NextResponse.json({ acceptances });
  } catch (error) {
    console.error("Get acceptances error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = acceptSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { termId } = result.data;

    // Verify term exists
    const term = await prisma.consentTerm.findUnique({
      where: { id: termId },
    });

    if (!term || !term.isActive) {
      return NextResponse.json({ error: "Term not found" }, { status: 404 });
    }

    // Check if already accepted
    const existing = await prisma.consentAcceptance.findFirst({
      where: {
        userId: session.userId,
        termId,
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Term already accepted" },
        { status: 200 }
      );
    }

    // Get user agent from headers
    const userAgent = request.headers.get("user-agent") || "";

    // Accept term
    const acceptance = await prisma.consentAcceptance.create({
      data: {
        userId: session.userId,
        termId,
        ipAddress: request.headers.get("x-forwarded-for") || "",
        userAgent,
      },
      include: { term: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "CONSENT_ACCEPT",
        entityType: "ConsentAcceptance",
        entityId: acceptance.id,
        payload: { termId, termType: term.type },
      },
    });

    return NextResponse.json({ acceptance }, { status: 201 });
  } catch (error) {
    console.error("Accept term error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
