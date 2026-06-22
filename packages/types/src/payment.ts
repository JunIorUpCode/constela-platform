// ==============================================
// Payment Types
// ==============================================

export enum PaymentMethod {
  PIX = "PIX",
  CARD = "CARD",
}

export enum PaymentStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  CANCELED = "CANCELED",
  REFUNDED = "REFUNDED",
  EXPIRED = "EXPIRED",
}

export interface Payment {
  id: string;
  sessionId: string;
  amountCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  externalId: string | null;
  qrCode: string | null;
  qrCodeUrl: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
