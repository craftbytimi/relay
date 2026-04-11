import { Events, type Client, type TextChannel } from "discord.js";
import { getDb } from "../../db/index.js";

export function registerMessageCreate(client: Client) {
  client.on(Events.MessageCreate, async (message) => {
    // Ignore bot messages and DMs
    if (message.author.bot || !message.guild) return;

    const db = getDb();
    const guildId = message.guild.id;

    // Fetch enabled rules for this guild
    const rules = await db.moderationRule.findMany({
      where: { relayId: guildId, enabled: true },
    });

    if (rules.length === 0) return;

    const content = message.content.toLowerCase();

    for (const rule of rules) {
      let matched = false;

      if (rule.type === "BANNED_PHRASE") {
        matched = content.includes(rule.pattern.toLowerCase());
      } else if (rule.type === "REGEX") {
        try {
          matched = new RegExp(rule.pattern, "i").test(message.content);
        } catch {
          // Invalid regex stored — skip
          continue;
        }
      }

      if (!matched) continue;

      // Take the configured action
      if (rule.action === "DELETE" || rule.action === "WARN" || rule.action === "MUTE") {
        // Always delete the offending message
        try {
          await message.delete();
        } catch {
          // May lack permissions — continue to logging
        }
      }

      if (rule.action === "WARN") {
        try {
          await message.author.send(
            `⚠️ Your message in **${message.guild.name}** was removed for violating a moderation rule.`,
          );
        } catch {
          // DMs may be disabled
        }
      }

      if (rule.action === "MUTE") {
        const member = message.member ?? await message.guild.members.fetch(message.author.id).catch(() => null);
        if (member) {
          try {
            // 10-minute timeout for auto-mod mute
            await member.timeout(10 * 60 * 1000, `Auto-mod: matched rule ${rule.id}`);
          } catch {
            // May lack permissions
          }
        }
      }

      // Log to mod log channel
      const settings = await db.relaySetting.findUnique({
        where: { relayId: guildId },
      });

      if (settings?.modLogChannelId) {
        const logChannel = message.guild.channels.cache.get(settings.modLogChannelId) as TextChannel | undefined;
        if (logChannel) {
          await logChannel.send(
            `🛡️ **Auto-Mod** — ${rule.action} on <@${message.author.id}> in <#${message.channelId}>\nRule: \`${rule.id}\` (${rule.type}: \`${rule.pattern}\`)`,
          );
        }
      }

      // Stop after first matching rule
      break;
    }
  });
}
