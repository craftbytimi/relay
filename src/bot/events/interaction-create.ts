import { Events, type ChatInputCommandInteraction, type Client } from "discord.js";
import { commands } from "../commands/index.js";

export function registerInteractionCreate(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    const command = commands.get(interaction.commandName);

    if (!command){
      await interaction.reply({ content: "This command is not implemented yet!", ephemeral: true });
      console.error(`No command matching ${interaction.commandName} was found.`);
      return;
    };

    try {
      await command.execute(interaction as ChatInputCommandInteraction);
    } catch (error) {
      console.error(error);
      await interaction.reply({ content: "There was an error while executing this command!", ephemeral: true });
    }
  });
}
