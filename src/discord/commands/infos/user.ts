import { createCommand } from '@base';
import { prisma } from '@db';
import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import { createUserInfoEmbed } from 'menus/userinfo/user.info.js';

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
	run: async (_client, interaction) => {
		const sub = interaction.options.getSubcommand(true);
		if (sub !== 'info') return;

		const user = interaction.options.getUser('user', true);

		const fullUserData = await prisma.user.findUnique({
			where: { discord_id: user.id },
		});

		const embed = createUserInfoEmbed(user, fullUserData, interaction.locale);

		await interaction.reply({
			components: [embed.container],
			flags: [MessageFlags.IsComponentsV2],
		});
	},
});
