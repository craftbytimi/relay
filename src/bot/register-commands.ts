import { REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger({ LOG_LEVEL: "info", NODE_ENV: "development" });

export async function registerCommands(token: string, clientId: string, guildId?: string) {
  const rest = new REST({ version: "10" }).setToken(token);

  const body = [...commands.values()].map((cmd) => cmd.data.toJSON());

  try {
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
      logger.info({ guildId }, "Registered application commands for guild");
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body });
      logger.info("Registered application commands globally");
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to register application commands");
  }
}
