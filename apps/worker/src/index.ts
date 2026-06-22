import { Worker } from "bullmq";
import Redis from "ioredis";
import { emailQueue, notificationQueue, QUEUE_NAMES } from "./queues";
import { sendEmail } from "./services/email-service";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

// ==============================================
// Email Worker
// ==============================================

const emailWorker = new Worker(
  QUEUE_NAMES.EMAIL,
  async (job) => {
    console.log(`Processing email job: ${job.id}`);

    const result = await sendEmail(job.data);

    if (!result) {
      throw new Error("Failed to send email");
    }

    return result;
  },
  { connection, concurrency: 5 }
);

emailWorker.on("completed", (job) => {
  console.log(`Email job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Email job ${job?.id} failed:`, err.message);
});

// ==============================================
// Notification Worker
// ==============================================

const notificationWorker = new Worker(
  QUEUE_NAMES.NOTIFICATIONS,
  async (job) => {
    console.log(`Processing notification job: ${job.id}`);

    const { userId, type, title, message, data } = job.data;

    // In a real implementation, this would:
    // 1. Store notification in database
    // 2. Send push notification if user has token
    // 3. Send SMS if configured

    console.log(`Notification for user ${userId}: ${title}`);

    // Store in database (mock)
    // await prisma.notification.create({ data: { userId, type, title, message, data } });

    return true;
  },
  { connection, concurrency: 10 }
);

notificationWorker.on("completed", (job) => {
  console.log(`Notification job ${job.id} completed`);
});

notificationWorker.on("failed", (job, err) => {
  console.error(`Notification job ${job?.id} failed:`, err.message);
});

// ==============================================
// Graceful Shutdown
// ==============================================

const gracefulShutdown = async () => {
  console.log("Shutting down workers...");

  await emailWorker.close();
  await notificationWorker.close();

  console.log("Workers shut down");
  process.exit(0);
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// ==============================================
// Start Workers
// ==============================================

console.log("🚀 Workers started");
console.log(`   - Email worker: ${QUEUE_NAMES.EMAIL}`);
console.log(`   - Notification worker: ${QUEUE_NAMES.NOTIFICATIONS}`);
