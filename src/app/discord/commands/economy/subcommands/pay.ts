import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createRow, EmbedPlusBuilder } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonStyle,
	Colors,
	ComponentType,
	EmbedBuilder,
	TimestampStyles,
	time,
} from 'discord.js';
import { UserController } from '../../../../jobs/UserController.js';
import { createErrorEmbed, getUserFullData, payUser } from './utils.js';

export const paySubCommand = createSubCommand({
	name: 'pay',
	description: 'Pay another user',
	name_localizations: {
		'pt-BR': 'pagar',
		'es-ES': 'pagar',
	},
	description_localizations: {
		'pt-BR': 'Pague outro usuário',
		'es-ES': 'Paga a otro usuario',
	},
	options: [
		{
			name: 'user',
			description: 'User to pay',
			type: ApplicationCommandOptionType.User,
			required: true,
			name_localizations: {
				'pt-BR': 'usuario',
				'es-ES': 'usuario',
			},
			description_localizations: {
				'pt-BR': 'Usuário que receberá',
				'es-ES': 'Usuario que recibirá',
			},
		},
		{
			name: 'amount',
			description: 'Amount to pay',
			type: ApplicationCommandOptionType.Number,
			required: true,
			min_value: 1,
			name_localizations: {
				'pt-BR': 'quantia',
				'es-ES': 'cantidad',
			},
			description_localizations: {
				'pt-BR': 'Quantia para pagar',
				'es-ES': 'Cantidad a pagar',
			},
		},
		{
			name: 'method',
			description: 'Payment method',
			type: ApplicationCommandOptionType.String,
			name_localizations: {
				'pt-BR': 'método',
				'es-ES': 'método',
			},
			description_localizations: {
				'pt-BR': 'Método de pagamento',
				'es-ES': 'Método de pago',
			},
			choices: [
				{
					name: 'Wallet',
					value: 'balance',
					name_localizations: {
						'pt-BR': 'Carteira',
						'es-ES': 'Cartera',
					},
				},
				{
					name: 'Bank',
					value: 'bank',
					name_localizations: {
						'pt-BR': 'Banco',
						'es-ES': 'Banco',
					},
				},
			],
		},
	],
	run: async ({ client, interaction }) => {
		await interaction.deferReply();

		try {
			const userToPay = interaction.options.getUser('user', true);
			const amount = interaction.options.getNumber('amount', true);
			const method =
				(interaction.options.getString('method') as 'balance' | 'bank') ??
				'balance';

			const receiver = await UserController.get(userToPay.id);
			if (!receiver) {
				const embed = createErrorEmbed(
					interaction.locale,
					replyLang(interaction.locale, 'eco#pay#error#title'),
					replyLang(interaction.locale, 'eco#pay#error#receiverNotFound', {
						user: userToPay.username,
					}),
				);
				await interaction.editReply({ embeds: [embed] });
				return;
			}

			const payerData = await getUserFullData(interaction.user.id);
			if (!payerData) {
				const embed = createErrorEmbed(
					interaction.locale,
					replyLang(interaction.locale, 'eco#pay#error#title'),
					replyLang(interaction.locale, 'user#notFound') +
					' ' +
					replyLang(interaction.locale, 'eco#error#createAccount'),
				);
				await interaction.editReply({ embeds: [embed] });
				return;
			}

			const sourceBalance =
				method === 'bank' ? payerData.bank : payerData.balance;
			const taxRate = method === 'bank' ? 0.1 : 0.025;
			const robberyChance = method === 'bank' ? 0.01 : 0.4;
			const tax = Math.floor(amount * taxRate);
			const totalCost = amount + tax;

			const infoEmbed = new EmbedPlusBuilder({
				color: Colors.Blue,
				author: {
					name: replyLang(interaction.locale, 'eco#pay#confirmation#title'),
					iconURL: interaction.user.displayAvatarURL(),
				},
				description: replyLang(
					interaction.locale,
					'eco#pay#confirmation#description',
					{
						payer: interaction.user.displayName,
						receiver: userToPay.displayName,
						amount: amount.toLocaleString(),
						method: replyLang(interaction.locale, `eco#pay#method#${method}`),
					},
				),
				fields: [
					{
						name: `📊 ${replyLang(interaction.locale, 'eco#pay#details#title')}`,
						value: [
							`**${replyLang(interaction.locale, 'eco#pay#details#amount')}:** \`${amount.toLocaleString()}\` polens`,
							`**${replyLang(interaction.locale, 'eco#pay#details#fee')}:** \`${tax.toLocaleString()}\` polens (${(taxRate * 100).toFixed(1)}%)`,
							`**${replyLang(interaction.locale, 'eco#pay#details#total')}:** \`${totalCost.toLocaleString()}\` polens`,
							`**${replyLang(interaction.locale, 'eco#pay#details#robbery')}:** ${(robberyChance * 100).toFixed(1)}%`,
						].join('\n'),
						inline: false,
					},
					{
						name: `💰 ${replyLang(interaction.locale, 'eco#pay#balance#current')}`,
						value: `\`${sourceBalance.toLocaleString()}\` polens`,
						inline: false,
					},
				],
				thumbnail: {
					url: userToPay.displayAvatarURL({ size: 128 }),
				},
				timestamp: Date.now(),
				footer: {
					text: `${replyLang(interaction.locale, 'eco#pay#footer')} • ${time(new Date(Date.now() + 5 * 60 * 1000), TimestampStyles.RelativeTime)}`,
					iconURL: client.user?.displayAvatarURL(),
				},
			});

			if (sourceBalance < totalCost) {
				infoEmbed
					.setColor(Colors.Red)
					.setAuthor({
						name: replyLang(interaction.locale, 'eco#pay#error#title'),
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setDescription(
						replyLang(interaction.locale, 'eco#pay#error#insufficientFunds', {
							amount: totalCost.toLocaleString(),
						}),
					);

				await interaction.editReply({ embeds: [infoEmbed] });
				return;
			}

			const row = createRow(
				new ButtonBuilder({
					custom_id: 'accept/pay',
					label: replyLang(interaction.locale, 'eco#pay#confirmation#accept'),
					style: ButtonStyle.Danger,
					emoji: emotes.utils.checkmark,
				}),
				new ButtonBuilder({
					custom_id: 'decline/pay',
					label: replyLang(interaction.locale, 'eco#pay#confirmation#decline'),
					style: ButtonStyle.Secondary,
					emoji: emotes.utils.crossmark,
				}),
			);

			const msg = await interaction.editReply({
				embeds: [infoEmbed],
				components: [row],
			});

			const collector = msg.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 5 * 60 * 1000,
			});

			collector.on('collect', async (i) => {
				if (i.user.id !== userToPay.id) {
					const errorEmbed = createErrorEmbed(
						interaction.locale,
						'',
						replyLang(interaction.locale, 'eco#pay#error#notReceiver'),
					);
					await i.reply({ embeds: [errorEmbed], flags: ['Ephemeral'] });
					return;
				}

				if (i.customId === 'accept/pay') {
					try {
						const result = await payUser(
							interaction.user.id,
							userToPay.id,
							amount,
							method,
							interaction.locale,
						);

						const successEmbed = new EmbedBuilder({
							color: result.robbed ? Colors.Orange : Colors.Green,
							author: {
								name: replyLang(interaction.locale, 'eco#pay#success#title'),
								iconURL: client.user?.displayAvatarURL(),
							},
							description: replyLang(
								interaction.locale,
								'eco#pay#success#description',
								{
									payer: interaction.user.displayName,
									receiver: userToPay.displayName,
								},
							),
							fields: [
								{
									name: `📤 ${replyLang(interaction.locale, 'eco#pay#success#sent')}`,
									value: `\`${result.sent.toLocaleString()}\` polens`,
									inline: true,
								},
								{
									name: `💸 ${replyLang(interaction.locale, 'eco#pay#success#fee')}`,
									value: `\`${result.fee.toLocaleString()}\` polens`,
									inline: true,
								},
								{
									name: `📥 ${replyLang(interaction.locale, 'eco#pay#success#received')}`,
									value: `\`${result.received.toLocaleString()}\` polens`,
									inline: true,
								},
							],
							thumbnail: {
								url: userToPay.displayAvatarURL({ size: 128 }),
							},
							timestamp: Date.now(),
						});

						if (result.robbed) {
							successEmbed.addFields({
								name: `🦹 ${replyLang(interaction.locale, 'eco#pay#success#robbed')}`,
								value: replyLang(
									interaction.locale,
									'eco#pay#success#robbedDescription',
									{
										stolen: result.stolen.toLocaleString(),
									},
								),
								inline: false,
							});
						}

						await i.update({ embeds: [successEmbed], components: [] });
					} catch (err: any) {
						console.error('[pay] Error:', err);
						const errorEmbed = createErrorEmbed(
							interaction.locale,
							replyLang(interaction.locale, 'eco#pay#error#title'),
							err.message,
						);
						await i.update({ embeds: [errorEmbed], components: [] });
					}
					collector.stop('done');
				} else if (i.customId === 'decline/pay') {
					const declineEmbed = new EmbedBuilder()
						.setColor(Colors.Red)
						.setAuthor({
							name: replyLang(interaction.locale, 'eco#pay#declined#title'),
							iconURL: userToPay.displayAvatarURL(),
						})
						.setDescription(
							replyLang(interaction.locale, 'eco#pay#declined#message', {
								payer: interaction.user.displayName,
								receiver: userToPay.displayName,
							}),
						)
						.setTimestamp();

					await i.update({ embeds: [declineEmbed], components: [] });
					collector.stop('declined');
				}
			});

			collector.on('end', async (collected, reason) => {
				if (reason === 'time') {
					const expiredEmbed = new EmbedBuilder()
						.setColor(Colors.Orange)
						.setAuthor({
							name: replyLang(interaction.locale, 'eco#pay#expired#title'),
							iconURL: client.user?.displayAvatarURL(),
						})
						.setDescription(
							replyLang(interaction.locale, 'eco#pay#expired#message', {
								payer: interaction.user.displayName,
								receiver: userToPay.displayName,
							}),
						)
						.setTimestamp();

					await msg.edit({ embeds: [expiredEmbed], components: [] });
				}
			});
		} catch (error: any) {
			console.error('[pay] Error:', error);
			const embed = createErrorEmbed(
				interaction.locale,
				replyLang(interaction.locale, 'eco#pay#error#title'),
				error.message || replyLang(interaction.locale, 'eco#error#generic'),
			);
			await interaction.editReply({ embeds: [embed] });
		}
	},
});
