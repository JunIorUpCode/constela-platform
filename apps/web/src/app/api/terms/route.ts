import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const termSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  type: z.enum(["PRIVACY_POLICY", "TERMS_OF_USE", "CONSENT_FORM", "DATA_PROCESSING"]),
  version: z.string(),
  isActive: z.boolean().default(true),
});

export async function GET() {
  try {
    const terms = await prisma.consentTerm.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ terms });
  } catch (error) {
    console.error("Get terms error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only platform admin can create terms
    if (session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = termSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { title, content, type, version, isActive } = result.data;

    const term = await prisma.consentTerm.create({
      data: {
        title,
        content,
        type,
        version,
        isActive,
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "TERM_CREATE",
        entityType: "ConsentTerm",
        entityId: term.id,
      },
    });

    return NextResponse.json({ term }, { status: 201 });
  } catch (error) {
    console.error("Create term error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
