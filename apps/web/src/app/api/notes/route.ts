import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { z } from "zod";

const noteSchema = z.object({
  sessionId: z.string().cuid("ID de sessão inválido"),
  content: z.string().min(1, "Conteúdo é obrigatório"),
  isPrivate: z.boolean().default(true),
});

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only practitioners can create notes
    if (session.role !== "PRACTITIONER" && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const result = noteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, content, isPrivate } = result.data;

    // Verify session belongs to practitioner
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { practitioner: true },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (sessionData.practitioner.userId !== session.userId && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create note
    const note = await prisma.sceneEvent.create({
      data: {
        sessionId,
        eventType: "NOTE",
        payload: {
          content,
          isPrivate,
        },
        createdBy: session.userId,
        version: 1,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("Create note error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get session to verify access
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { practitioner: true },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check access
    const isPractitioner = sessionData.practitioner.userId === session.userId;
    const canAccess = session.role === "PLATFORM_ADMIN" || isPractitioner;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get notes (practitioners see all, others see only non-private)
    const notes = await prisma.sceneEvent.findMany({
      where: {
        sessionId,
        eventType: "NOTE",
        ...(isPractitioner ? {} : { payload: { path: ["isPrivate"], equals: false } }),
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Get notes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
