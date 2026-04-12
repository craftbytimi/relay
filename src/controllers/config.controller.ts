import { getDb } from "../db/index.js";
import type { RelayConfig, UpdateRelayConfigInput } from "../types/config.type.js";

export class ConfigController {
  private get db() {
    return getDb();
  }

  async getSettings(relayId: string): Promise<RelayConfig | null> {
    const settings = await this.db.relaySetting.findUnique({
      where: { relayId },
    });

    if (!settings) return null;

    return {
      relayId: settings.relayId,
      welcomeMessage: settings.welcomeMessage,
      welcomeChannelId: settings.welcomeChannelId,
      modLogChannelId: settings.modLogChannelId,
    };
  }

  async updateSettings(relayId: string, relayName: string, input: UpdateRelayConfigInput): Promise<RelayConfig> {
    // Ensure relay exists
    await this.db.relay.upsert({
      where: { id: relayId },
      create: { id: relayId, name: relayName },
      update: {},
    });

    const settings = await this.db.relaySetting.upsert({
      where: { relayId },
      create: { relayId, ...input },
      update: input,
    });

    return {
      relayId: settings.relayId,
      welcomeMessage: settings.welcomeMessage,
      welcomeChannelId: settings.welcomeChannelId,
      modLogChannelId: settings.modLogChannelId,
    };
  }
}

export default new ConfigController();
