import { createCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { SlashCommandBuilder } from 'discord.js';
import { UserController } from '../../../jobs/UserController.js';

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('create')
		.setDescription('Just a sub-command related to creation.')
		.setDescriptionLocalizations({
			'pt-BR': 'Apenas um sub-comando relacionado a criação.',
			'es-ES': 'Solo un subcomando relacionado con la creación.',
		})
		.setNameLocalizations({
			'pt-BR': 'criar',
			'es-ES': 'crear',
		})
		.addSubcommand((subcommand) =>
			subcommand
				.setName('account')
				.setDescription('Create your account to unlock economy systems!')
				.setDescriptionLocalizations({
					'pt-BR': 'Crie sua conta para liberar sistemas de economia!',
					'es-ES': '¡Crea tu cuenta para desbloquear los sistemas de economía!',
				})
				.setNameLocalizations({
					'pt-BR': 'conta',
					'es-ES': 'cuenta',
				}),
		),
	cooldown: 50,
	run: async ({ interaction }) => {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'account') {
			const result = await UserController.create(interaction.user.id);

			function reply() {
				if (result.alreadyExists) {
					return replyLang(interaction.locale, 'create_user#already', {
						user_mention: `<@${interaction.user.id}>`,
					});
				}
				if (result.success) {
					return replyLang(interaction.locale, 'create_user#created', {
						user_mention: `<@${interaction.user.id}>`,
					});
				}
				return replyLang(interaction.locale, 'create_user#fail', {
					user_mention: `<@${interaction.user.id}>`,
				});
			}

			await interaction.reply({
				flags: ['Ephemeral'],
				content: reply(),
			});
		}
	},
});
