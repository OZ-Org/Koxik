import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { ApplicationCommandOptionType } from 'discord.js';
import { createErrorEmbed, createSuccessEmbed, depositMoney } from './utils.js';

export const depositSubCommand = createSubCommand({
	name: 'deposit',
	description: 'Deposit money to your bank',
	name_localizations: {
		'pt-BR': 'depositar',
		'es-ES': 'depositar',
	},
	description_localizations: {
		'pt-BR': 'Deposite dinheiro no banco',
		'es-ES': 'Deposita dinero en tu banco',
	},
	options: [
		{
			name: 'amount',
			description: 'Amount to deposit',
			type: ApplicationCommandOptionType.Number,
			required: true,
			min_value: 1,
			name_localizations: {
				'pt-BR': 'quantia',
				'es-ES': 'cantidad',
			},
			description_localizations: {
				'pt-BR': 'Quantia para depositar',
				'es-ES': 'Cantidad a depositar',
			},
		},
	],
	run: async ({ interaction }) => {
		await interaction.deferReply();

		try {
			const amount = interaction.options.getNumber('amount', true);
			const result = await depositMoney(
				interaction.user.id,
				amount,
				interaction.locale,
			);

			const embed = createSuccessEmbed(
				replyLang(interaction.locale, 'eco#deposit#success#title'),
				replyLang(interaction.locale, 'eco#deposit#success#description', {
					amount: result.deposited.toLocaleString(),
				}),
			)
				.addFields(
					{
						name: `💰 ${replyLang(interaction.locale, 'eco#deposit#success#newBalance')}`,
						value: `\`${result.newBalance.toLocaleString()}\` polens`,
						inline: true,
					},
					{
						name: `🏦 ${replyLang(interaction.locale, 'eco#deposit#success#newBank')}`,
						value: `\`${result.newBank.toLocaleString()}\` polens`,
						inline: true,
					},
				)
				.setThumbnail(interaction.user.displayAvatarURL({ size: 128 }));

			await interaction.editReply({ embeds: [embed] });
		} catch (error: any) {
			console.error('[deposit] Error:', error);
			const embed = createErrorEmbed(
				interaction.locale,
				replyLang(interaction.locale, 'eco#deposit#error#title'),
				error.message,
			);
			await interaction.editReply({ embeds: [embed] });
		}
	},
});
