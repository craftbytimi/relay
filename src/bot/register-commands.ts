
import {REST, Routes} from "discord.js";  
import { commands } from "./commands/index.js";


export async function registerCommands(token: string, clientId: string, guildId?: string) {
  const rest = new REST({ version: "10" }).setToken(token);

  const body = [...commands.values()].map((cmd) => cmd.data.toJSON());


  try {    
    if (guildId) {
      await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body });
      console.log("Successfully registered application commands for guild " + guildId);
    } else {
      await rest.put(Routes.applicationCommands(clientId), { body });
      console.log("Successfully registered application commands globally");
    }
  } 
  catch (error) {
    console.error(error);
  }
}
