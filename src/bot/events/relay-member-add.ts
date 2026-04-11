import { Events, type Client, type TextChannel } from "discord.js";
import { getDb } from "../../db/index.js";

export function registerGuildMemberAdd(client: Client) {
  client.on(Events.GuildMemberAdd, async (member) => {
    const db = getDb();
    const guildId = member.guild.id;

    const settings = await db.relaySetting.findUnique({
      where: { relayId: guildId },
    });

    if (!settings) return;

    // Send welcome message
    if (settings.welcomeChannelId && settings.welcomeMessage) {
      const channel = member.guild.channels.cache.get(settings.welcomeChannelId) as TextChannel | undefined;
      if (channel) {
        const message = settings.welcomeMessage
          .replaceAll("{user}", `<@${member.id}>`)
          .replaceAll("{server}", member.guild.name)
          .replaceAll("{memberCount}", String(member.guild.memberCount));

        await channel.send(message);
      }
    }

    // Log to mod log channel
    if (settings.modLogChannelId) {
      const logChannel = member.guild.channels.cache.get(settings.modLogChannelId) as TextChannel | undefined;
      if (logChannel) {
        const timestamp = Math.floor(member.user.createdTimestamp / 1000);
        await logChannel.send(
          `📥 **Member Joined** — <@${member.id}> (${member.user.tag})\nAccount created: <t:${timestamp}:R>`,
        );
      }
    }
  });
}
