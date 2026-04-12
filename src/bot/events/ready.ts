import { ActivityType, Events, type Client } from "discord.js";
import { createLogger } from "../../utils/logger.js";

const logger = createLogger({ LOG_LEVEL: "info", NODE_ENV: "development" });

export function registerReady(client: Client) {
  client.once(Events.ClientReady, (readyClient) => {
    logger.info({ tag: readyClient.user.tag }, "Bot online");

    readyClient.user.setActivity("over the relay", {
      type: ActivityType.Watching,
    });
  });
}
