import { ActivityType, Events, type Client } from "discord.js";

export function registerReady(client: Client) {
  client.once(Events.ClientReady, (readyClient) => {
    console.log(`Bot online as ${readyClient.user.tag}`);

    readyClient.user.setActivity("over the relay", {
      type: ActivityType.Watching,
    });
  });
}
