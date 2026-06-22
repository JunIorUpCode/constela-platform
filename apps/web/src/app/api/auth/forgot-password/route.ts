import { NextResponse } from "next/server";
import { generatePasswordResetToken } from "@/lib/auth";
import { forgotPasswordSchema } from "@constela/validators/auth";
import { prisma } from "@constela/db";

// In a real implementation, this would send an email
// For now, we'll just return the token in development

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase();

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true, email: true },
    });

    // Always return success to prevent email enumeration
    // But only actually generate token if user exists
    if (user) {
      const token = await generatePasswordResetToken(normalizedEmail);

      // In production, send email here
      // For development, log the token
      if (process.env.NODE_ENV === "development") {
        console.log(`🔑 Password reset token for ${email}: ${token}`);
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: "PASSWORD_RESET_REQUEST",
          entityType: "User",
          entityId: user.id,
        },
      });
    }

    // Always return same message
    return NextResponse.json({
      message:
        "If an account exists with this email, you will receive a password reset link.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
