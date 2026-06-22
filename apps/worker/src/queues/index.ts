import { Queue, Worker, Job } from "bullmq";
import Redis from "ioredis";

// ==============================================
// Redis Connection
// ==============================================

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// ==============================================
// Queue Names
// ==============================================

export const QUEUE_NAMES = {
  EMAIL: "email",
  NOTIFICATIONS: "notifications",
  PAYMENTS: "payments",
  AI_TASKS: "ai-tasks",
} as const;

// ==============================================
// Email Types
// ==============================================

export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, string>;
}

export interface EmailJob extends Job<EmailJobData> {}

// ==============================================
// Notification Types
// ==============================================

export interface NotificationJobData {
  userId: string;
  type: "SESSION_REMINDER" | "PAYMENT_CONFIRMED" | "SESSION_CANCELED";
  title: string;
  message: string;
  data?: Record<string, string>;
}

export interface NotificationJob extends Job<NotificationJobData> {}

// ==============================================
// Payment Types
// ==============================================

export interface PaymentJobData {
  sessionId: string;
  userId: string;
  type: "PAYMENT_PENDING" | "PAYMENT_APPROVED" | "PAYMENT_REJECTED";
}

export interface PaymentJob extends Job<PaymentJobData> {}

// ==============================================
// AI Task Types
// ==============================================

export interface AITaskJobData {
  sessionId: string;
  taskType: "SUMMARY" | "POST_SESSION_MESSAGE";
}

export interface AITaskJob extends Job<AITaskJobData> {}

// ==============================================
// Queue Factory
// ==============================================

export function createQueue<T extends JobData>(name: string): Queue<T> {
  return new Queue<T>(name, { connection });
}

export type JobData = EmailJobData | NotificationJobData | PaymentJobData | AITaskJobData;

// ==============================================
// Pre-configured Queues
// ==============================================

export const emailQueue = createQueue<EmailJobData>(QUEUE_NAMES.EMAIL);
export const notificationQueue = createQueue<NotificationJobData>(QUEUE_NAMES.NOTIFICATIONS);
export const paymentQueue = createQueue<PaymentJobData>(QUEUE_NAMES.PAYMENTS);
export const aiTaskQueue = createQueue<AITaskJobData>(QUEUE_NAMES.AI_TASKS);

// ==============================================
// Add Job Helpers
// ==============================================

export async function addEmailJob(data: EmailJobData, delay?: number) {
  const options = delay ? { delay } : {};
  return emailQueue.add("send-email", data, options);
}

export async function addNotificationJob(data: NotificationJobData) {
  return notificationQueue.add("send-notification", data);
}

export async function addPaymentJob(data: PaymentJobData) {
  return paymentQueue.add("process-payment", data);
}

export async function addAITaskJob(data: AITaskJobData) {
  return aiTaskQueue.add("process-ai-task", data);
}

// ==============================================
// Health Check
// ==============================================

export async function checkQueueHealth() {
  const queues = [emailQueue, notificationQueue, paymentQueue, aiTaskQueue];
  const health: Record<string, { status: string; waiting: number; active: number }> = {};

  for (const queue of queues) {
    const [waiting, active] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
    ]);
    health[queue.name] = { status: "ok", waiting, active };
  }

  return health;
}

export { connection, QUEUE_NAMES };
