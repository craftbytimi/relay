import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getDb } from "../../db/index.js";

export const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("View or update relay settings")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addSubcommand((sub) =>
    sub.setName("view").setDescription("View current relay settings"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("set")
      .setDescription("Update a relay setting")
      .addStringOption((opt) =>
        opt
          .setName("key")
          .setDescription("The setting to update")
          .setRequired(true)
          .addChoices(
            { name: "welcome_channel", value: "welcomeChannelId" },
            { name: "mod_log_channel", value: "modLogChannelId" },
            { name: "welcome_message", value: "welcomeMessage" },
          ),
      )
      .addStringOption((opt) =>
        opt
          .setName("value")
          .setDescription("The new value (channel ID or message text)")
          .setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const db = getDb();
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "view") {
    await handleView(interaction, db, guildId);
  } else if (subcommand === "set") {
    await handleSet(interaction, db, guildId);
  }
}

async function handleView(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const settings = await db.relaySetting.findUnique({
    where: { relayId: guildId },
  });

  if (!settings) {
    await interaction.reply({ content: "No settings configured yet. Use `/config set` to get started.", ephemeral: true });
    return;
  }

  const welcomeChannel = settings.welcomeChannelId
    ? `<#${settings.welcomeChannelId}>`
    : "*Not set*";
  const modLogChannel = settings.modLogChannelId
    ? `<#${settings.modLogChannelId}>`
    : "*Not set*";
  const welcomeMessage = settings.welcomeMessage || "*Not set*";

  await interaction.reply({
    content: [
      "**Relay Settings**",
      `Welcome Channel: ${welcomeChannel}`,
      `Mod Log Channel: ${modLogChannel}`,
      `Welcome Message: ${welcomeMessage}`,
    ].join("\n"),
    ephemeral: true,
  });
}

async function handleSet(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const key = interaction.options.getString("key", true);
  let value = interaction.options.getString("value", true);

  // For channel settings, extract the ID from a mention like <#123456>
  if (key.endsWith("ChannelId")) {
    const match = value.match(/^<#(\d+)>$/);
    if (match?.[1]) {
      value = match[1];
    }

    // Validate the channel exists in this guild
    const channel = interaction.guild?.channels.cache.get(value);
    if (!channel || channel.type !== ChannelType.GuildText) {
      await interaction.reply({ content: "Please provide a valid text channel.", ephemeral: true });
      return;
    }
  }

  // Upsert the relay first to ensure it exists
  await db.relay.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild?.name ?? "Unknown" },
    update: {},
  });

  await db.relaySetting.upsert({
    where: { relayId: guildId },
    create: { relayId: guildId, [key]: value },
    update: { [key]: value },
  });

  const label = key === "welcomeChannelId"
    ? "Welcome Channel"
    : key === "modLogChannelId"
      ? "Mod Log Channel"
      : "Welcome Message";

  await interaction.reply({
    content: `**${label}** updated successfully.`,
    ephemeral: true,
  });
}
