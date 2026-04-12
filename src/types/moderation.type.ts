import type { ModerationActionType } from "@prisma/client";

export interface ModerationInput {
  userId: string;
  username: string;
  relayId: string;
  relayName: string;
  reason: string;
  moderatorId: string;
  moderatorUsername: string;
}

export interface ModerationResult {
  id: string;
  action: ModerationActionType;
  reason: string;
  duration?: number;
  userId: string;
  moderatorId: string;
  relayId: string;
  createdAt: Date;
}
