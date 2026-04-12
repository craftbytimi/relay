import { Client, GatewayIntentBits } from "discord.js";

let _bot: Client | null = null;

export function createBot(): Client {
  _bot = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
  return _bot;
}

export function getBot(): Client | null {
  return _bot;
}
