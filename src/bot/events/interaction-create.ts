import { Events, type ChatInputCommandInteraction, type Client } from "discord.js";
import { commands } from "../commands/index.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger({ LOG_LEVEL: "info", NODE_ENV: "development" });

export function registerInteractionCreate(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

    if (!command) {
      await interaction.reply({ content: "This command is not implemented yet!", ephemeral: true });
      logger.warn({ command: interaction.commandName }, "Unrecognized command received");
      return;
    }

    try {
      await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
      logger.error({ err: error, command: interaction.commandName }, "Command execution failed");
      const reply = { content: "There was an error while executing this command!", ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply);
      } else {
        await interaction.reply(reply);
      }
    }
  });
}
