import type { ReminderStatus } from "@prisma/client";

export interface ReminderEntry {
  id: string;
  message: string;
  dueAt: Date;
  channelId: string;
  status: ReminderStatus;
  userId: string;
  relayId: string;
  createdAt: Date;
}

export interface CreateReminderInput {
  message: string;
  dueAt: Date;
  channelId: string;
  userId: string;
  username: string;
  relayId: string;
  relayName: string;
}
