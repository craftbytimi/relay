import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getDb } from "../../db/index.js";
import type { RuleType, RuleAction } from "@prisma/client";

export const data = new SlashCommandBuilder()
  .setName("mod")
  .setDescription("Moderation tools")
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
  .addSubcommandGroup((group) =>
    group
      .setName("rule")
      .setDescription("Manage auto-moderation rules")
      .addSubcommand((sub) =>
        sub
          .setName("add")
          .setDescription("Add an auto-moderation rule")
          .addStringOption((opt) =>
            opt
              .setName("type")
              .setDescription("Rule type")
              .setRequired(true)
              .addChoices(
                { name: "Banned phrase", value: "BANNED_PHRASE" },
                { name: "Regex pattern", value: "REGEX" },
              ),
          )
          .addStringOption((opt) =>
            opt
              .setName("pattern")
              .setDescription("The phrase or regex pattern to match")
              .setRequired(true),
          )
          .addStringOption((opt) =>
            opt
              .setName("action")
              .setDescription("Action to take on match")
              .addChoices(
                { name: "Delete message", value: "DELETE" },
                { name: "Warn user", value: "WARN" },
                { name: "Mute user", value: "MUTE" },
              ),
          ),
      )
      .addSubcommand((sub) =>
        sub.setName("list").setDescription("List all auto-moderation rules"),
      )
      .addSubcommand((sub) =>
        sub
          .setName("remove")
          .setDescription("Remove an auto-moderation rule")
          .addStringOption((opt) =>
            opt
              .setName("id")
              .setDescription("The rule ID to remove")
              .setRequired(true),
          ),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("warn")
      .setDescription("Warn a user")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The user to warn").setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("reason")
          .setDescription("Reason for the warning")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub
      .setName("history")
      .setDescription("View moderation history for a user")
      .addUserOption((opt) =>
        opt.setName("user").setDescription("The user to look up").setRequired(true),
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const db = getDb();
  const group = interaction.options.getSubcommandGroup(false);
  const subcommand = interaction.options.getSubcommand();

  if (group === "rule") {
    if (subcommand === "add") await handleRuleAdd(interaction, db, guildId);
    else if (subcommand === "list") await handleRuleList(interaction, db, guildId);
    else if (subcommand === "remove") await handleRuleRemove(interaction, db, guildId);
  } else if (subcommand === "warn") {
    await handleWarn(interaction, db, guildId);
  } else if (subcommand === "history") {
    await handleHistory(interaction, db, guildId);
  }
}

// --- Rule subcommands ---

async function handleRuleAdd(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const type = interaction.options.getString("type", true) as RuleType;
  const pattern = interaction.options.getString("pattern", true);
  const action = (interaction.options.getString("action") ?? "DELETE") as RuleAction;

  // Validate regex if type is REGEX
  if (type === "REGEX") {
    try {
      new RegExp(pattern);
    } catch {
      await interaction.reply({ content: "Invalid regex pattern.", ephemeral: true });
      return;
    }
  }

  // Ensure relay exists
  await db.relay.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild?.name ?? "Unknown" },
    update: {},
  });

  const rule = await db.moderationRule.create({
    data: { type, pattern, action, relayId: guildId },
  });

  await interaction.reply({
    content: `Rule added: **${type}** matching \`${pattern}\` → **${action}** (\`${rule.id}\`)`,
    ephemeral: true,
  });
}

async function handleRuleList(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const rules = await db.moderationRule.findMany({
    where: { relayId: guildId },
    orderBy: { createdAt: "desc" },
  });

  if (rules.length === 0) {
    await interaction.reply({ content: "No moderation rules configured.", ephemeral: true });
    return;
  }

  const lines = rules.map(
    (r) =>
      `• \`${r.id}\` ${r.enabled ? "✅" : "❌"} **${r.type}** \`${r.pattern}\` → **${r.action}**`,
  );

  await interaction.reply({
    content: `**Moderation Rules**\n${lines.join("\n")}`,
    ephemeral: true,
  });
}

async function handleRuleRemove(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const id = interaction.options.getString("id", true);

  const rule = await db.moderationRule.findFirst({
    where: { id, relayId: guildId },
  });

  if (!rule) {
    await interaction.reply({ content: "Rule not found.", ephemeral: true });
    return;
  }

  await db.moderationRule.delete({ where: { id } });
  await interaction.reply({ content: `Rule \`${id}\` removed.`, ephemeral: true });
}

// --- Warn subcommand ---

async function handleWarn(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const targetUser = interaction.options.getUser("user", true);
  const reason = interaction.options.getString("reason", true);
  const moderatorId = interaction.user.id;

  // Ensure relay exists
  await db.relay.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild?.name ?? "Unknown" },
    update: {},
  });

  // Ensure both users exist
  await db.user.upsert({
    where: { id: targetUser.id },
    create: { id: targetUser.id, username: targetUser.username, discriminator: targetUser.discriminator ?? "0" },
    update: { username: targetUser.username },
  });
  await db.user.upsert({
    where: { id: moderatorId },
    create: { id: moderatorId, username: interaction.user.username, discriminator: interaction.user.discriminator ?? "0" },
    update: { username: interaction.user.username },
  });

  const action = await db.moderationAction.create({
    data: {
      action: "WARN",
      reason,
      userId: targetUser.id,
      moderatorId,
      relayId: guildId,
    },
  });

  // Try to DM the warned user
  try {
    await targetUser.send(`⚠️ You have been warned in **${interaction.guild?.name}** — ${reason}`);
  } catch {
    // User may have DMs disabled — that's fine
  }

  await interaction.reply({
    content: `Warned <@${targetUser.id}> — ${reason} (\`${action.id}\`)`,
  });
}

// --- History subcommand ---

async function handleHistory(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const targetUser = interaction.options.getUser("user", true);

  const actions = await db.moderationAction.findMany({
    where: { userId: targetUser.id, relayId: guildId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { moderator: true },
  });

  if (actions.length === 0) {
    await interaction.reply({
      content: `No moderation history for <@${targetUser.id}>.`,
      ephemeral: true,
    });
    return;
  }

  const lines = actions.map((a) => {
    const timestamp = Math.floor(a.createdAt.getTime() / 1000);
    return `• **${a.action}** by <@${a.moderatorId}> <t:${timestamp}:R> — ${a.reason}`;
  });

  await interaction.reply({
    content: `**Moderation History — ${targetUser.username}**\n${lines.join("\n")}`,
    ephemeral: true,
  });
}
