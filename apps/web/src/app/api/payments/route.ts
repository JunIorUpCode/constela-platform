import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { getCurrentSession } from "@/lib/auth";
import { createPaymentSchema } from "@constela/validators/payment";
import { createPaymentProvider } from "@/lib/payment-provider";

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createPaymentSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation error", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { sessionId, method } = result.data;

    // Get session
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        practitioner: {
          include: { user: true },
        },
        participants: {
          where: { userId: session.userId },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if user is participant
    const isParticipant =
      sessionData.practitioner.userId === session.userId ||
      sessionData.participants.length > 0;

    if (!isParticipant && session.role !== "PLATFORM_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { sessionId },
    });

    if (existingPayment && existingPayment.status === "APPROVED") {
      return NextResponse.json({ error: "Payment already approved" }, { status: 400 });
    }

    // Create payment with Mercado Pago
    const provider = createPaymentProvider();

    const paymentResult = await provider.createPayment({
      sessionId,
      amountCents: sessionData.priceCents || 0,
      method,
      customer: {
        email: session.email,
        name: session.name,
      },
      description: `Sessão de Constelação: ${sessionData.title}`,
    });

    // Save payment to database
    const payment = await prisma.payment.upsert({
      where: { sessionId },
      update: {
        amountCents: sessionData.priceCents || 0,
        method,
        status: "PENDING",
        externalId: paymentResult.externalId,
        qrCode: paymentResult.qrCode || null,
        qrCodeUrl: paymentResult.qrCodeUrl || null,
        expiresAt: paymentResult.expiresAt || null,
      },
      create: {
        sessionId,
        amountCents: sessionData.priceCents || 0,
        method,
        status: "PENDING",
        externalId: paymentResult.externalId,
        qrCode: paymentResult.qrCode || null,
        qrCodeUrl: paymentResult.qrCodeUrl || null,
        expiresAt: paymentResult.expiresAt || null,
      },
    });

    // Update session status
    await prisma.session.update({
      where: { id: sessionId },
      data: { status: "AWAITING_PAYMENT" },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.userId,
        tenantId: session.tenantId,
        action: "PAYMENT_CREATE",
        entityType: "Payment",
        entityId: payment.id,
        payload: { sessionId, method, amount: sessionData.priceCents },
      },
    });

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        qrCode: payment.qrCode,
        qrCodeUrl: payment.qrCodeUrl,
        expiresAt: payment.expiresAt,
      },
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
