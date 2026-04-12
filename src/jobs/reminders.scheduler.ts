import type { Client, TextChannel } from "discord.js";
import { getDb } from "../db/index.js";
import type { AppLogger } from "../utils/logger.js";

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const MAX_RETRIES = 3;

export class ReminderScheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(
    private readonly client: Client,
    private readonly logger: AppLogger,
  ) {}

  start() {
    if (this.timer) return;
    this.logger.info("Reminder scheduler started");
    this.timer = setInterval(() => void this.poll(), POLL_INTERVAL_MS);
    // Run immediately on start
    void this.poll();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.info("Reminder scheduler stopped");
    }
  }

  private async poll() {
    if (this.running) return; // prevent overlapping polls
    this.running = true;

    try {
      const db = getDb();
      const now = new Date();

      // Fetch due reminders that are still pending
      const dueReminders = await db.reminder.findMany({
        where: {
          status: "PENDING",
          dueAt: { lte: now },
        },
        take: 20,
        orderBy: { dueAt: "asc" },
      });

      for (const reminder of dueReminders) {
        try {
          // Mark as processing to prevent double-sends (optimistic)
          await db.reminder.update({
            where: { id: reminder.id, status: "PENDING" },
            data: { retries: { increment: 1 } },
          });

          // Attempt delivery
          const channel = this.client.channels.cache.get(reminder.channelId) as TextChannel | undefined
            ?? await this.client.channels.fetch(reminder.channelId).catch(() => null) as TextChannel | null;

          if (channel && "send" in channel) {
            await channel.send(`⏰ <@${reminder.userId}> Reminder: ${reminder.message}`);

            await db.reminder.update({
              where: { id: reminder.id },
              data: { status: "DELIVERED" },
            });

            this.logger.debug({ reminderId: reminder.id }, "Reminder delivered");
          } else {
            throw new Error("Channel not found or not sendable");
          }
        } catch (error) {
          const newRetries = reminder.retries + 1;

          if (newRetries >= MAX_RETRIES) {
            await db.reminder.update({
              where: { id: reminder.id },
              data: { status: "FAILED" },
            });
            this.logger.warn({ reminderId: reminder.id, error }, "Reminder failed after max retries");
          } else {
            this.logger.debug({ reminderId: reminder.id, retries: newRetries }, "Reminder delivery failed, will retry");
          }
        }
      }
    } catch (error) {
      this.logger.error({ error }, "Reminder scheduler poll error");
    } finally {
      this.running = false;
    }
  }
}
