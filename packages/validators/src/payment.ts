import { z } from "zod";

// ==============================================
// Payment Schemas
// ==============================================

export const createPaymentSchema = z.object({
  sessionId: z.string().cuid("ID de sessão inválido"),
  method: z.enum(["PIX", "CARD"]),
});

export const paymentWebhookSchema = z.object({
  action: z.string(),
  api_version: z.string(),
  data: z.object({
    id: z.string(),
  }),
  id: z.string(),
  live_mode: z.boolean(),
  type: z.string(),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type PaymentWebhookInput = z.infer<typeof paymentWebhookSchema>;
