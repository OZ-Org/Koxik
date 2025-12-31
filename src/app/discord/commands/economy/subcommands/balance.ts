import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { EmbedPlusBuilder } from '@magicyan/discord';
import { ApplicationCommandOptionType, Colors } from 'discord.js';
import { createErrorEmbed, getUserFullData } from './utils.js';

export const balanceSubCommand = createSubCommand({
	name: 'balance',
	description: 'Check your balance',

	name_localizations: {
		'pt-BR': 'saldo',
		'es-ES': 'saldo',
	},
	description_localizations: {
		'pt-BR': 'Veja sua bufunfa',
		'es-ES': 'Ver tu dinero',
	},
	cooldown: 10,
	options: [
		{
			name: 'user',
			description: 'Which user will see the balance?',
			type: ApplicationCommandOptionType.User,
			name_localizations: {
				'pt-BR': 'usuario',
				'es-ES': 'usuario',
			},
			description_localizations: {
				'pt-BR': 'Qual usuário você quer ver o saldo?',
				'es-ES': '¿Qué usuario verá el saldo?',
			},
		},
	],
	run: async ({ client, interaction }) => {
		await interaction.deferReply({ flags: ['Ephemeral'] });

		try {
			const userToSee = interaction.options.getUser('user') ?? interaction.user;
			const userData = await getUserFullData(userToSee.id);

			if (!userData) {
				const embed = createErrorEmbed(
					interaction.locale,
					replyLang(interaction.locale, 'eco#balance#userNotFound#title'),
					replyLang(
						interaction.locale,
						'eco#balance#userNotFound#description',
						{
							user: userToSee.displayName,
						},
					),
				);
				await interaction.editReply({ embeds: [embed] });
				return;
			}

			const total = userData.balance + userData.bank;
			const embed = new EmbedPlusBuilder({
				author: {
					name: replyLang(interaction.locale, 'eco#balance#title'),
					iconURL: client.user?.displayAvatarURL(),
				},
				color: Colors.Gold,
				description: `**${userToSee.displayName}**`,
				fields: [
					{
						name: `💰 ${replyLang(interaction.locale, 'eco#balance#wallet')}`,
						value: `\`${userData.balance.toLocaleString()}\` polens`,
						inline: true,
					},
					{
						name: `🏦 ${replyLang(interaction.locale, 'eco#balance#bank')}`,
						value: `\`${userData.bank.toLocaleString()}\` polens`,
						inline: true,
					},
					{
						name: `💎 ${replyLang(interaction.locale, 'eco#balance#total')}`,
						value: `\`${total.toLocaleString()}\` polens`,
						inline: false,
					},
				],
				thumbnail: {
					url: userToSee.displayAvatarURL({ size: 256 }),
				},
				timestamp: new Date(),
				footer: {
					text: replyLang(interaction.locale, 'eco#balance#footer'),
					iconURL: interaction.user.displayAvatarURL(),
				},
			});

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error('[balance] Error:', error);
			const embed = createErrorEmbed(
				interaction.locale,
				replyLang(interaction.locale, 'eco#error#title'),
				replyLang(interaction.locale, 'eco#error#generic'),
			);
			await interaction.editReply({ embeds: [embed] });
		}
	},
});
