import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is deleting own account
    if (session.userId !== id && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete - anonymize data
    const user = await prisma.user.update({
      where: { id },
      data: {
        email: `deleted_${Date.now()}@anonymized.local`,
        name: "Usuário Excluído",
        passwordHash: null,
        isActive: false,
      },
    });

    // Delete audit logs related to this user
    await prisma.auditLog.updateMany({
      where: { userId: id },
      data: {
        userId: null,
      },
    });

    // Delete consent acceptances
    await prisma.consentAcceptance.deleteMany({
      where: { userId: id },
    });

    return NextResponse.json({
      message: "User data anonymized successfully",
      userId: user.id,
    });
  } catch (error) {
    console.error("Delete user data error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
