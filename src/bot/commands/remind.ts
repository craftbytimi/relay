import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import { getDb } from "../../db/index.js";

export const data = new SlashCommandBuilder()
  .setName("remind")
  .setDescription("Manage reminders")
  .addSubcommand((sub) =>
    sub
      .setName("create")
      .setDescription("Create a new reminder")
      .addStringOption((opt) =>
        opt
          .setName("message")
          .setDescription("What to remind you about")
          .setRequired(true),
      )
      .addStringOption((opt) =>
        opt
          .setName("in")
          .setDescription("When to remind you (e.g. 10m, 2h, 1d)")
          .setRequired(true),
      ),
  )
  .addSubcommand((sub) =>
    sub.setName("list").setDescription("List your pending reminders"),
  )
  .addSubcommand((sub) =>
    sub
      .setName("delete")
      .setDescription("Cancel a pending reminder")
      .addStringOption((opt) =>
        opt
          .setName("id")
          .setDescription("The reminder ID to cancel")
          .setRequired(true),
      ),
  );

/** Parse a duration string like "10m", "2h", "1d" into milliseconds. */
function parseDuration(input: string): number | null {
  const match = input.trim().match(/^(\d+)\s*(m|h|d)$/i);
  if (!match) return null;

  const amount = Number(match[1]);
  const unit = match[2]!.toLowerCase();

  const multipliers: Record<string, number> = { m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * (multipliers[unit] ?? 0);
}

export async function execute(interaction: ChatInputCommandInteraction) {
  const guildId = interaction.guildId;
  if (!guildId) {
    await interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
    return;
  }

  const db = getDb();
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "create") {
    await handleCreate(interaction, db, guildId);
  } else if (subcommand === "list") {
    await handleList(interaction, db, guildId);
  } else if (subcommand === "delete") {
    await handleDelete(interaction, db, guildId);
  }
}

async function handleCreate(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const message = interaction.options.getString("message", true);
  const durationStr = interaction.options.getString("in", true);
  const ms = parseDuration(durationStr);

  if (!ms) {
    await interaction.reply({
      content: "Invalid duration. Use a format like `10m`, `2h`, or `1d`.",
      ephemeral: true,
    });
    return;
  }

  const dueAt = new Date(Date.now() + ms);
  const userId = interaction.user.id;

  // Ensure user exists
  await db.user.upsert({
    where: { id: userId },
    create: { id: userId, username: interaction.user.username, discriminator: interaction.user.discriminator ?? "0" },
    update: { username: interaction.user.username },
  });

  // Ensure relay exists
  await db.relay.upsert({
    where: { id: guildId },
    create: { id: guildId, name: interaction.guild?.name ?? "Unknown" },
    update: {},
  });

  const reminder = await db.reminder.create({
    data: {
      message,
      dueAt,
      channelId: interaction.channelId,
      userId,
      relayId: guildId,
    },
  });

  const timestamp = Math.floor(dueAt.getTime() / 1000);
  await interaction.reply({
    content: `Reminder set! I'll remind you <t:${timestamp}:R> — \`${reminder.id}\``,
    ephemeral: true,
  });
}

async function handleList(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const reminders = await db.reminder.findMany({
    where: {
      userId: interaction.user.id,
      relayId: guildId,
      status: "PENDING",
    },
    orderBy: { dueAt: "asc" },
    take: 10,
  });

  if (reminders.length === 0) {
    await interaction.reply({ content: "You have no pending reminders.", ephemeral: true });
    return;
  }

  const lines = reminders.map((r) => {
    const timestamp = Math.floor(r.dueAt.getTime() / 1000);
    return `• \`${r.id}\` — ${r.message} (<t:${timestamp}:R>)`;
  });

  await interaction.reply({
    content: `**Your Reminders**\n${lines.join("\n")}`,
    ephemeral: true,
  });
}

async function handleDelete(
  interaction: ChatInputCommandInteraction,
  db: ReturnType<typeof getDb>,
  guildId: string,
) {
  const id = interaction.options.getString("id", true);

  const reminder = await db.reminder.findFirst({
    where: {
      id,
      userId: interaction.user.id,
      relayId: guildId,
      status: "PENDING",
    },
  });

  if (!reminder) {
    await interaction.reply({ content: "Reminder not found or already delivered.", ephemeral: true });
    return;
  }

  await db.reminder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await interaction.reply({ content: `Reminder \`${id}\` cancelled.`, ephemeral: true });
}
