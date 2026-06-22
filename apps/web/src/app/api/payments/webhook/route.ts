import { NextResponse } from "next/server";
import { prisma } from "@constela/db";
import { createPaymentProvider } from "@/lib/payment-provider";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-signature") || "";
    const provider = createPaymentProvider();

    // Verify signature (optional in development)
    if (process.env.NODE_ENV === "production") {
      if (!provider.verifyWebhookSignature(body, signature)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const data = JSON.parse(body);

    // Handle different notification types
    if (data.type === "payment") {
      const paymentId = data.data?.id;
      if (!paymentId) {
        return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
      }

      // Get payment status from Mercado Pago
      const status = await provider.getPaymentStatus(paymentId.toString());

      // Find our payment record
      const payment = await prisma.payment.findFirst({
        where: { externalId: paymentId.toString() },
        include: { session: true },
      });

      if (!payment) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      // Update payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status,
          paidAt: status === "APPROVED" ? new Date() : undefined,
        },
      });

      // Update session status based on payment
      if (status === "APPROVED") {
        await prisma.session.update({
          where: { id: payment.sessionId },
          data: { status: "PAID" },
        });

        // Create audit log
        await prisma.auditLog.create({
          data: {
            tenantId: payment.session.tenantId,
            action: "PAYMENT_APPROVED",
            entityType: "Payment",
            entityId: payment.id,
            payload: { sessionId: payment.sessionId },
          },
        });
      } else if (status === "REJECTED" || status === "EXPIRED") {
        await prisma.session.update({
          where: { id: payment.sessionId },
          data: { status: "SCHEDULED" },
        });
      }

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: "PAYMENT_WEBHOOK",
          entityType: "Payment",
          entityId: payment.id,
          payload: { externalStatus: status },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
