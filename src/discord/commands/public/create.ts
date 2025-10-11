import { createCommand } from '@base';
import { prisma } from '@db';
import { replyLang } from '@fx/utils/replyLang.js';
import { SlashCommandBuilder } from 'discord.js';

async function createUser(
	discord_id: string,
): Promise<{ success: boolean; exists?: boolean }> {
	try {
		const exists = await prisma.user.findFirst({
			where: {
				discord_id,
			},
		});

		if (exists) {
			return { success: false, exists: true };
		}

		await prisma.user.create({
			data: {
				discord_id,
			},
		});
		return { success: true };
	} catch (error) {
		return { success: false };
	}
}

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
	run: async (client, interaction) => {
		const subcommand = interaction.options.getSubcommand();

		if (subcommand === 'account') {
			const user = await createUser(interaction.user.id);

			function reply() {
				if (user.exists) {
					return replyLang(interaction.locale, 'create_user#already', {
						user_mention: `<@${interaction.user.id}>`,
					});
				}
				if (user.success) {
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
