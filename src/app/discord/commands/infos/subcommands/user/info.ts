import { createSubCommand } from "@base";
import { UserController } from '@app/jobs/UserController.js';
import { createUserInfoEmbed } from "@menus/userinfo/user.info.js";
import { MessageFlags, ApplicationCommandOptionType } from "discord.js";

export default createSubCommand({
  name: "info",
  description: "See information about a user",
  description_localizations: {
    'pt-BR': 'Veja informações sobre um usuário',
    'es-ES': 'Ve información de un usuario',
  },
  options: [
    {
      name: "user",
      description: "The user you want to see",
      description_localizations: {
        'pt-BR': 'Usuário que deseja ver',
        'es-ES': 'Usuario que quieres ver',
      },
      type: ApplicationCommandOptionType.User
    }
  ],
  async run({ interaction }) {
    await interaction.deferReply();

    const user = interaction.options.getUser('user', true);

    const fullUserData = await UserController.get(user.id);

    const embed = createUserInfoEmbed(user, fullUserData, interaction.locale);

    await interaction.editReply({
      components: [embed.container],
      flags: [MessageFlags.IsComponentsV2],
    });
  },
})

