import { NextResponse } from "next/server";
import { endSession } from "@/lib/auth";
import { prisma } from "@constela/db";

export async function POST() {
  try {
    const user = await prisma.user.findFirst({
      where: { lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: "desc" },
      select: { id: true },
    });

    if (user) {
      await endSession(user.id);
    }

    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
