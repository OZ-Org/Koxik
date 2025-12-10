import { createCommand } from '@base';
import { createUserInfoEmbed } from '@menus/userinfo/user.info.js';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { UserController } from '../../../jobs/UserController.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('User subcommands')
		.addSubcommand((sub) =>
			sub
				.setName('info')
				.setDescription('See information about a user')
				.setDescriptionLocalizations({
					'pt-BR': 'Veja informações sobre um usuário',
					'es-ES': 'Ve información de un usuario',
				})
				.addUserOption((opt) =>
					opt
						.setName('user')
						.setDescription('The user you want to see')
						.setDescriptionLocalizations({
							'pt-BR': 'Usuário que deseja ver',
							'es-ES': 'Usuario que quieres ver',
						})
						.setRequired(true),
				),
		),
	run: async ({ interaction }) => {
		const sub = interaction.options.getSubcommand(true);
		if (sub !== 'info') return;

		await interaction.deferReply();

		const user = interaction.options.getUser('user', true);

		const fullUserData = await UserController.get(user.id);

		const embed = createUserInfoEmbed(user, fullUserData, interaction.locale);

		await interaction.editReply({
			components: [embed.container],
			flags: [MessageFlags.IsComponentsV2],
		});
	},
});
