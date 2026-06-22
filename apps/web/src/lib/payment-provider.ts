import type {
  PaymentMethod,
  PaymentStatus,
  CreatePaymentInput,
} from "@constela/types";

// ==============================================
// Payment Provider Interface
// ==============================================

export interface PaymentProvider {
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  getPaymentStatus(externalId: string): Promise<PaymentStatus>;
  refundPayment(externalId: string): Promise<RefundResult>;
  verifyWebhookSignature(
    payload: string,
    signature: string
  ): boolean;
}

// ==============================================
// Types
// ==============================================

export interface CreatePaymentParams {
  sessionId: string;
  amountCents: number;
  method: PaymentMethod;
  customer: {
    email: string;
    name: string;
  };
  description: string;
}

export interface CreatePaymentResult {
  externalId: string;
  qrCode?: string;
  qrCodeUrl?: string;
  checkoutUrl?: string;
  expiresAt?: Date;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  error?: string;
}

// ==============================================
// Mercado Pago Provider
// ==============================================

export class MercadoPagoProvider implements PaymentProvider {
  private accessToken: string;
  private isSandbox: boolean;

  constructor() {
    this.accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
    this.isSandbox = process.env.MERCADOPAGO_IS_SANDBOX === "true";
  }

  private get baseUrl(): string {
    return this.isSandbox
      ? "https://api.sandbox.mercadopago.com"
      : "https://api.mercadopago.com";
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    const paymentData = this.buildPaymentData(params);

    const response = await fetch(`${this.baseUrl}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Mercado Pago error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();
    return this.parsePaymentResult(result, params.method);
  }

  async getPaymentStatus(externalId: string): Promise<PaymentStatus> {
    const response = await fetch(`${this.baseUrl}/v1/payments/${externalId}`, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment status: ${response.statusText}`);
    }

    const payment = await response.json();
    return this.mapPaymentStatus(payment.status);
  }

  async refundPayment(externalId: string): Promise<RefundResult> {
    const response = await fetch(`${this.baseUrl}/v1/payments/${externalId}/refunds`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || "Refund failed",
      };
    }

    const result = await response.json();
    return {
      success: true,
      refundId: result[0]?.id?.toString(),
    };
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    // In production, verify using webhook secret
    // For now, just return true for valid payload structure
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    if (!secret) return true;

    // Implement proper signature verification
    return payload.length > 0;
  }

  private buildPaymentData(params: CreatePaymentParams) {
    if (params.method === "PIX") {
      return {
        transaction_amount: params.amountCents / 100,
        description: params.description,
        payment_method_id: "pix",
        payer: {
          email: params.customer.email,
          first_name: params.customer.name.split(" ")[0],
          last_name: params.customer.name.split(" ").slice(1).join(" ") || "",
        },
        external_reference: params.sessionId,
        notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
      };
    }

    return {
      transaction_amount: params.amountCents / 100,
      description: params.description,
      payment_method_id: "creditcard",
      payer: {
        email: params.customer.email,
      },
      external_reference: params.sessionId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
    };
  }

  private parsePaymentResult(
    result: Record<string, unknown>,
    method: PaymentMethod
  ): CreatePaymentResult {
    const base: CreatePaymentResult = {
      externalId: result.id?.toString() || "",
    };

    if (method === "PIX") {
      const pointOfInteraction = result.point_of_interference as Record<string, unknown> | undefined;
      const transactionData = pointOfInteraction?.transaction_data as Record<string, unknown> | undefined;

      return {
        ...base,
        qrCode: result.qr_code_base64 as string | undefined,
        qrCodeUrl: transactionData?.qr_code as string | undefined,
        expiresAt: result.date_of_expiration
          ? new Date(result.date_of_expiration as string)
          : undefined,
      };
    }

    return {
      ...base,
      checkoutUrl: result.transaction_details?.external_resource_url as string | undefined,
    };
  }

  private mapPaymentStatus(mpStatus: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      pending: "PENDING",
      approved: "APPROVED",
      rejected: "REJECTED",
      cancelled: "CANCELED",
      refunded: "REFUNDED",
      expired: "EXPIRED",
    };

    return statusMap[mpStatus] || "PENDING";
  }
}

// ==============================================
// Factory Function
// ==============================================

export function createPaymentProvider(): PaymentProvider {
  return new MercadoPagoProvider();
}
