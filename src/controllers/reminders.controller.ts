import { getDb } from "../db/index.js";
import type { ReminderEntry, CreateReminderInput } from "../types/reminders.type.js";

export class RemindersController {
  private get db() {
    return getDb();
  }

  async create(input: CreateReminderInput): Promise<ReminderEntry> {
    // Ensure user exists
    await this.db.user.upsert({
      where: { id: input.userId },
      create: { id: input.userId, username: input.username, discriminator: "0" },
      update: { username: input.username },
    });

    // Ensure relay exists
    await this.db.relay.upsert({
      where: { id: input.relayId },
      create: { id: input.relayId, name: input.relayName },
      update: {},
    });

    const reminder = await this.db.reminder.create({
      data: {
        message: input.message,
        dueAt: input.dueAt,
        channelId: input.channelId,
        userId: input.userId,
        relayId: input.relayId,
      },
    });

    return {
      id: reminder.id,
      message: reminder.message,
      dueAt: reminder.dueAt,
      channelId: reminder.channelId,
      status: reminder.status,
      userId: reminder.userId,
      relayId: reminder.relayId,
      createdAt: reminder.createdAt,
    };
  }

  async listPending(userId: string, relayId: string): Promise<ReminderEntry[]> {
    const reminders = await this.db.reminder.findMany({
      where: { userId, relayId, status: "PENDING" },
      orderBy: { dueAt: "asc" },
      take: 10,
    });

    return reminders.map((r) => ({
      id: r.id,
      message: r.message,
      dueAt: r.dueAt,
      channelId: r.channelId,
      status: r.status,
      userId: r.userId,
      relayId: r.relayId,
      createdAt: r.createdAt,
    }));
  }

  async cancel(id: string, userId: string, relayId: string): Promise<boolean> {
    const reminder = await this.db.reminder.findFirst({
      where: { id, userId, relayId, status: "PENDING" },
    });

    if (!reminder) return false;

    await this.db.reminder.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return true;
  }

  async getDueReminders(limit = 20) {
    return this.db.reminder.findMany({
      where: {
        status: "PENDING",
        dueAt: { lte: new Date() },
      },
      take: limit,
      orderBy: { dueAt: "asc" },
    });
  }

  async markDelivered(id: string) {
    await this.db.reminder.update({
      where: { id },
      data: { status: "DELIVERED" },
    });
  }

  async markFailed(id: string) {
    await this.db.reminder.update({
      where: { id },
      data: { status: "FAILED" },
    });
  }

  async incrementRetries(id: string) {
    await this.db.reminder.update({
      where: { id },
      data: { retries: { increment: 1 } },
    });
  }
}

export default new RemindersController();
