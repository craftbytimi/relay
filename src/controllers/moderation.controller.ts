import { randomUUID } from "node:crypto";

// --- Input Types ---

interface WarnInput {
  userId: string;
  relayId: string;
  reason: string;
  moderatorId: string;
}

interface BanInput {
  userId: string;
  relayId: string;
  reason: string;
  moderatorId: string;
}

interface KickInput {
  userId: string;
  relayId: string;
  reason: string;
  moderatorId: string;
}

interface MuteInput {
  userId: string;
  relayId: string;
  reason: string;
  moderatorId: string;
  duration: number; // in minutes
}

// --- Result Types ---

interface ModerationResult {
  id: string;
  action: "warn" | "ban" | "kick" | "mute";
  userId: string;
  relayId: string;
  reason: string;
  moderatorId: string;
  createdAt: Date;
}

interface MuteResult extends ModerationResult {
  action: "mute";
  duration: number;
  expiresAt: Date;
}

// --- Controller ---

export class ModerationController {
  async warnUser(input: WarnInput): Promise<ModerationResult> {
    const warning: ModerationResult = {
      id: randomUUID(),
      action: "warn",
      userId: input.userId,
      relayId: input.relayId,
      reason: input.reason,
      moderatorId: input.moderatorId,
      createdAt: new Date(),
    };

    // TODO: save to database

    return warning;
  }

  async banUser(input: BanInput): Promise<ModerationResult> {
    const ban: ModerationResult = {
      id: randomUUID(),
      action: "ban",
      userId: input.userId,
      relayId: input.relayId,
      reason: input.reason,
      moderatorId: input.moderatorId,
      createdAt: new Date(),
    };

    // TODO: save to database
    // TODO: call Discord API to ban the user from the relay

    return ban;
  }

  async kickUser(input: KickInput): Promise<ModerationResult> {
    const kick: ModerationResult = {
      id: randomUUID(),
      action: "kick",
      userId: input.userId,
      relayId: input.relayId,
      reason: input.reason,
      moderatorId: input.moderatorId,
      createdAt: new Date(),
    };

    // TODO: save to database
    // TODO: call Discord API to kick the user from the relay

    return kick;
  }

  async muteUser(input: MuteInput): Promise<MuteResult> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + input.duration * 60_000);

    const mute: MuteResult = {
      id: randomUUID(),
      action: "mute",
      userId: input.userId,
      relayId: input.relayId,
      reason: input.reason,
      moderatorId: input.moderatorId,
      duration: input.duration,
      createdAt: now,
      expiresAt,
    };

    // TODO: save to database
    // TODO: call Discord API to timeout the user

    return mute;
  }
}

export default new ModerationController();
