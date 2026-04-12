import type { Guild } from "discord.js";
import { getDb } from "../db/index.js";
import type { ModerationResult, ModerationInput } from "../types/moderation.type.js";

export class ModerationController {
  private get db() {
    return getDb();
  }

  private async ensureUsers(userId: string, username: string, moderatorId: string, moderatorUsername: string) {
    await this.db.user.upsert({
      where: { id: userId },
      create: { id: userId, username, discriminator: "0" },
      update: { username },
    });
    await this.db.user.upsert({
      where: { id: moderatorId },
      create: { id: moderatorId, username: moderatorUsername, discriminator: "0" },
      update: { username: moderatorUsername },
    });
  }

  private async ensureRelay(relayId: string, relayName: string) {
    await this.db.relay.upsert({
      where: { id: relayId },
      create: { id: relayId, name: relayName },
      update: {},
    });
  }

  async warnUser(input: ModerationInput): Promise<ModerationResult> {
    await this.ensureRelay(input.relayId, input.relayName);
    await this.ensureUsers(input.userId, input.username, input.moderatorId, input.moderatorUsername);

    const action = await this.db.moderationAction.create({
      data: {
        action: "WARN",
        reason: input.reason,
        userId: input.userId,
        moderatorId: input.moderatorId,
        relayId: input.relayId,
      },
    });

    return {
      id: action.id,
      action: action.action,
      reason: action.reason,
      userId: action.userId,
      moderatorId: action.moderatorId,
      relayId: action.relayId,
      createdAt: action.createdAt,
    };
  }

  async banUser(input: ModerationInput, guild: Guild): Promise<ModerationResult> {
    await this.ensureRelay(input.relayId, input.relayName);
    await this.ensureUsers(input.userId, input.username, input.moderatorId, input.moderatorUsername);

    // Execute Discord ban
    await guild.members.ban(input.userId, { reason: input.reason });

    const action = await this.db.moderationAction.create({
      data: {
        action: "BAN",
        reason: input.reason,
        userId: input.userId,
        moderatorId: input.moderatorId,
        relayId: input.relayId,
      },
    });

    return {
      id: action.id,
      action: action.action,
      reason: action.reason,
      userId: action.userId,
      moderatorId: action.moderatorId,
      relayId: action.relayId,
      createdAt: action.createdAt,
    };
  }

  async kickUser(input: ModerationInput, guild: Guild): Promise<ModerationResult> {
    await this.ensureRelay(input.relayId, input.relayName);
    await this.ensureUsers(input.userId, input.username, input.moderatorId, input.moderatorUsername);

    // Execute Discord kick
    const member = await guild.members.fetch(input.userId);
    await member.kick(input.reason);

    const action = await this.db.moderationAction.create({
      data: {
        action: "KICK",
        reason: input.reason,
        userId: input.userId,
        moderatorId: input.moderatorId,
        relayId: input.relayId,
      },
    });

    return {
      id: action.id,
      action: action.action,
      reason: action.reason,
      userId: action.userId,
      moderatorId: action.moderatorId,
      relayId: action.relayId,
      createdAt: action.createdAt,
    };
  }

  async muteUser(input: ModerationInput & { duration: number }, guild: Guild): Promise<ModerationResult> {
    await this.ensureRelay(input.relayId, input.relayName);
    await this.ensureUsers(input.userId, input.username, input.moderatorId, input.moderatorUsername);

    // Execute Discord timeout
    const member = await guild.members.fetch(input.userId);
    await member.timeout(input.duration * 60_000, input.reason);

    const action = await this.db.moderationAction.create({
      data: {
        action: "MUTE",
        reason: input.reason,
        duration: input.duration,
        userId: input.userId,
        moderatorId: input.moderatorId,
        relayId: input.relayId,
      },
    });

    return {
      id: action.id,
      action: action.action,
      reason: action.reason,
      duration: input.duration,
      userId: action.userId,
      moderatorId: action.moderatorId,
      relayId: action.relayId,
      createdAt: action.createdAt,
    };
  }

  async getHistory(userId: string, relayId: string, limit = 10): Promise<ModerationResult[]> {
    const actions = await this.db.moderationAction.findMany({
      where: { userId, relayId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return actions.map((a) => {
      const result: ModerationResult = {
        id: a.id,
        action: a.action,
        reason: a.reason,
        userId: a.userId,
        moderatorId: a.moderatorId,
        relayId: a.relayId,
        createdAt: a.createdAt,
      };
      if (a.duration != null) {
        result.duration = a.duration;
      }
      return result;
    });
  }
}

export default new ModerationController();
