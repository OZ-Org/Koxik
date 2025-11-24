import { createCommand } from '@base';
import { prisma } from '@db';
import { replyLang } from '@fx/utils/replyLang.js';
import { createRow, EmbedPlusBuilder } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	ButtonBuilder,
	ButtonStyle,
	Colors,
	ComponentType,
	EmbedBuilder,
	type Locale,
	SlashCommandBuilder,
	TimestampStyles,
	time,
} from 'discord.js';

export interface Transaction {
	id: string;
	type:
		| 'daily'
		| 'pay_sent'
		| 'pay_received'
		| 'deposit'
		| 'withdraw'
		| 'mine_created';
	amount: number;
	timestamp: number;
	description?: string;
	from?: string;
	to?: string;
}

interface UserData {
	balance: number;
	bank: number;
	transactions: Transaction[];
}

interface PaymentResult {
	sent: number;
	fee: number;
	robbed: boolean;
	stolen: number;
	received: number;
	method: 'balance' | 'bank';
}

interface DailyResult {
	balance: number;
	bonus: number;
	streakDays: number;
}

function parseTransactions(raw: unknown): Transaction[] {
	if (!raw) return [];
	if (Array.isArray(raw)) return raw as Transaction[];
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw);
			return Array.isArray(parsed) ? (parsed as Transaction[]) : [];
		} catch {
			return [];
		}
	}
	if (typeof raw === 'object') return raw as Transaction[];
	return [];
}

function generateTransactionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function createErrorEmbed(
	locale: Locale,
	title: string,
	description: string,
): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(Colors.Red)
		.setTitle(`❌ ${title}`)
		.setDescription(description)
		.setTimestamp()
		.setFooter({ text: replyLang(locale, 'eco#footer#error') });
}

function createSuccessEmbed(title: string, description: string): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(Colors.Green)
		.setTitle(`✅ ${title}`)
		.setDescription(description)
		.setTimestamp();
}

async function getUserFullData(discordId: string): Promise<UserData | null> {
	try {
		const user = await prisma.user.findUnique({
			where: { discord_id: discordId },
		});

		if (!user) return null;

		return {
			balance: user.balance,
			bank: user.bank ?? 0,
			transactions: parseTransactions(user.transactions as unknown),
		};
	} catch (error) {
		console.error('[getUserFullData] Error:', error);
		throw error;
	}
}

async function addTransaction(
	discordId: string,
	transaction: Omit<Transaction, 'id'>,
): Promise<void> {
	try {
		const user = await prisma.user.findUnique({
			where: { discord_id: discordId },
		});

		if (!user) return;

		const transactions = parseTransactions(user.transactions as unknown);
		const newTransaction: Transaction = {
			...transaction,
			id: generateTransactionId(),
		};

		transactions.unshift(newTransaction);
		if (transactions.length > 50) transactions.splice(50);

		await prisma.user.update({
			where: { discord_id: discordId },
			data: { transactions: transactions as unknown as any },
		});
	} catch (error) {
		console.error('[addTransaction] Error:', error);
		throw error;
	}
}

// ==================== BUSINESS LOGIC ====================
async function payUser(
	payerId: string,
	receiverId: string,
	amount: number,
	method: 'balance' | 'bank',
	locale: Locale,
): Promise<PaymentResult> {
	if (amount <= 0) {
		throw new Error(
			replyLang(locale, 'eco#pay#error#invalidAmount', { amount }),
		);
	}

	if (payerId === receiverId) {
		throw new Error(replyLang(locale, 'eco#pay#error#cannotPayYourself'));
	}

	const payer = await prisma.user.findUnique({
		where: { discord_id: payerId },
	});
	if (!payer) {
		throw new Error(
			replyLang(locale, 'user#notFound') +
				' ' +
				replyLang(locale, 'eco#error#createAccount'),
		);
	}

	const receiver = await prisma.user.findUnique({
		where: { discord_id: receiverId },
	});
	if (!receiver) {
		throw new Error(
			replyLang(locale, 'eco#pay#error#receiverNotFound', { user: receiverId }),
		);
	}

	const sourceBalance = method === 'bank' ? (payer.bank ?? 0) : payer.balance;
	const taxRate = method === 'bank' ? 0.1 : 0.025;
	const robberyChance = method === 'bank' ? 0.01 : 0.4;
	const tax = Math.floor(amount * taxRate);
	const totalCost = amount + tax;

	if (sourceBalance < totalCost) {
		throw new Error(
			replyLang(locale, 'eco#pay#error#insufficientFunds', {
				amount: totalCost.toLocaleString(),
			}),
		);
	}

	let robbed = false;
	let stolen = 0;
	let received = amount;

	if (Math.random() < robberyChance) {
		robbed = true;
		stolen = Math.floor(amount * 0.16);
		received = Math.max(0, amount - stolen);
	}

	// Transação atômica
	try {
		if (method === 'bank') {
			await prisma.user.update({
				where: { discord_id: payerId },
				data: { bank: { decrement: totalCost } },
			});
		} else {
			await prisma.user.update({
				where: { discord_id: payerId },
				data: { balance: { decrement: totalCost } },
			});
		}

		await prisma.user.update({
			where: { discord_id: receiverId },
			data: { balance: { increment: received } },
		});

		await addTransaction(payerId, {
			type: 'pay_sent',
			amount: -totalCost,
			timestamp: Date.now(),
			description: `Sent ${amount.toLocaleString()} (fee: ${tax.toLocaleString()})`,
			to: receiverId,
		});

		await addTransaction(receiverId, {
			type: 'pay_received',
			amount: received,
			timestamp: Date.now(),
			description: robbed
				? `Received (${stolen.toLocaleString()} stolen)`
				: 'Received',
			from: payerId,
		});

		return { sent: amount, fee: tax, robbed, stolen, received, method };
	} catch (error) {
		console.error('[payUser] Transaction failed:', error);
		throw new Error(replyLang(locale, 'eco#pay#error#transactionFailed'));
	}
}

async function claimDaily(
	discordId: string,
	dailyAmount: number,
	locale: Locale,
): Promise<DailyResult> {
	const now = new Date();
	const user = await prisma.user.findUnique({
		where: { discord_id: discordId },
	});

	if (!user) {
		throw new Error(
			replyLang(locale, 'user#notFound') +
				' ' +
				replyLang(locale, 'eco#error#createAccount'),
		);
	}

	if (user.lastDaily && now.getTime() - user.lastDaily.getTime() < 86400000) {
		const nextClaim = new Date(user.lastDaily.getTime() + 86400000);
		throw { cooldown: true, nextClaim };
	}

	const transactions = parseTransactions(user.transactions as unknown);
	const dailyTransactions = transactions
		.filter((t) => t.type === 'daily')
		.slice(0, 10);

	let streakDays = 0;
	let currentDate = now.getTime();
	const oneDayMs = 86400000;

	for (const transaction of dailyTransactions) {
		const daysDiff = Math.floor(
			(currentDate - transaction.timestamp) / oneDayMs,
		);
		if (daysDiff === 1) {
			streakDays++;
			currentDate = transaction.timestamp;
		} else {
			break;
		}
	}

	const bonus = streakDays >= 9 ? Math.floor(dailyAmount * 2) : 0;
	const totalReward = dailyAmount + bonus;

	try {
		const updatedUser = await prisma.user.update({
			where: { discord_id: discordId },
			data: {
				balance: { increment: totalReward },
				lastDaily: now,
			},
		});

		await addTransaction(discordId, {
			type: 'daily',
			amount: totalReward,
			timestamp: now.getTime(),
			description:
				bonus > 0 ? `Daily + ${bonus.toLocaleString()} streak` : 'Daily reward',
		});

		return { balance: updatedUser.balance, bonus, streakDays: streakDays + 1 };
	} catch (error) {
		console.error('[claimDaily] Error:', error);
		throw new Error(replyLang(locale, 'eco#daily#error#failed'));
	}
}

async function depositMoney(discordId: string, amount: number, locale: Locale) {
	if (amount <= 0) {
		throw new Error(replyLang(locale, 'eco#deposit#error#invalidAmount'));
	}

	const user = await prisma.user.findUnique({
		where: { discord_id: discordId },
	});
	if (!user) {
		throw new Error(
			replyLang(locale, 'user#notFound') +
				' ' +
				replyLang(locale, 'eco#error#createAccount'),
		);
	}

	if (user.balance < amount) {
		throw new Error(replyLang(locale, 'eco#deposit#error#insufficientFunds'));
	}

	try {
		const updatedUser = await prisma.user.update({
			where: { discord_id: discordId },
			data: {
				balance: { decrement: amount },
				bank: { increment: amount },
			},
		});

		await addTransaction(discordId, {
			type: 'deposit',
			amount,
			timestamp: Date.now(),
			description: `Deposited ${amount.toLocaleString()} polens`,
		});

		return {
			deposited: amount,
			newBalance: updatedUser.balance,
			newBank: updatedUser.bank ?? 0,
		};
	} catch (error) {
		console.error('[depositMoney] Error:', error);
		throw new Error(replyLang(locale, 'eco#deposit#error#failed'));
	}
}

async function getLeaderboard(limit = 10) {
	try {
		return await prisma.user.findMany({
			orderBy: { balance: 'desc' },
			take: limit,
			select: { discord_id: true, balance: true },
		});
	} catch (error) {
		console.error('[getLeaderboard] Error:', error);
		throw error;
	}
}

// ==================== COMMAND ====================
export default createCommand({
	data: new SlashCommandBuilder()
		.setName('eco')
		.setDescription('Economy commands')
		.setDescriptionLocalizations({
			'pt-BR': 'Comandos de economia',
			'es-ES': 'Comandos de economía',
		})
		.addSubcommand((sub) =>
			sub
				.setName('balance')
				.setDescription('Check your balance')
				.setNameLocalizations({
					'pt-BR': 'saldo',
					'es-ES': 'saldo',
				})
				.setDescriptionLocalizations({
					'pt-BR': 'Veja sua bufunfa',
					'es-ES': 'Ver tu dinero',
				})
				.addUserOption((user) =>
					user
						.setName('user')
						.setDescription('Which user will see the balance?')
						.setNameLocalizations({
							'pt-BR': 'usuario',
							'es-ES': 'usuario',
						})
						.setDescriptionLocalizations({
							'pt-BR': 'Qual usuário você quer ver o saldo?',
							'es-ES': '¿Qué usuario verá el saldo?',
						}),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('deposit')
				.setDescription('Deposit money to your bank')
				.setNameLocalizations({
					'pt-BR': 'depositar',
					'es-ES': 'depositar',
				})
				.setDescriptionLocalizations({
					'pt-BR': 'Deposite dinheiro no banco',
					'es-ES': 'Deposita dinero en tu banco',
				})
				.addNumberOption((opt) =>
					opt
						.setName('amount')
						.setDescription('Amount to deposit')
						.setNameLocalizations({
							'pt-BR': 'quantia',
							'es-ES': 'cantidad',
						})
						.setDescriptionLocalizations({
							'pt-BR': 'Quantia para depositar',
							'es-ES': 'Cantidad a depositar',
						})
						.setRequired(true)
						.setMinValue(1),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('pay')
				.setDescription('Pay another user')
				.setNameLocalizations({
					'pt-BR': 'pagar',
					'es-ES': 'pagar',
				})
				.setDescriptionLocalizations({
					'pt-BR': 'Pague outro usuário',
					'es-ES': 'Paga a otro usuario',
				})
				.addUserOption((opt) =>
					opt
						.setName('user')
						.setDescription('User to pay')
						.setNameLocalizations({
							'pt-BR': 'usuario',
							'es-ES': 'usuario',
						})
						.setDescriptionLocalizations({
							'pt-BR': 'Usuário que receberá',
							'es-ES': 'Usuario que recibirá',
						})
						.setRequired(true),
				)
				.addNumberOption((opt) =>
					opt
						.setName('amount')
						.setDescription('Amount to pay')
						.setNameLocalizations({
							'pt-BR': 'quantia',
							'es-ES': 'cantidad',
						})
						.setDescriptionLocalizations({
							'pt-BR': 'Quantia para pagar',
							'es-ES': 'Cantidad a pagar',
						})
						.setRequired(true)
						.setMinValue(1),
				)
				.addStringOption((opt) =>
					opt
						.setName('method')
						.setDescription('Payment method')
						.setNameLocalizations({
							'pt-BR': 'método',
							'es-ES': 'método',
						})
						.setDescriptionLocalizations({
							'pt-BR': 'Método de pagamento',
							'es-ES': 'Método de pago',
						})
						.addChoices(
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
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('daily')
				.setDescription('Claim your daily reward')
				.setNameLocalizations({
					'pt-BR': 'daily',
					'es-ES': 'diario',
				})
				.setDescriptionLocalizations({
					'pt-BR': 'Pegue sua recompensa diária',
					'es-ES': 'Reclama tu recompensa diaria',
				}),
		)
		.addSubcommand((sub) =>
			sub
				.setName('leaderboard')
				.setDescription('Check the richest users')
				.setNameLocalizations({
					'pt-BR': 'ranking',
					'es-ES': 'ranking',
				})
				.setDescriptionLocalizations({
					'pt-BR': 'Veja os mais ricos',
					'es-ES': 'Ve los más ricos',
				}),
		),

	run: async (client, interaction) => {
		const subcommand = interaction.options.getSubcommand(true);

		// ==================== BALANCE ====================
		if (subcommand === 'balance') {
			await interaction.deferReply({ flags: ['Ephemeral'] });

			try {
				const userToSee =
					interaction.options.getUser('user') ?? interaction.user;
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
					timestamp: Date.now().toLocaleString(),
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
		}

		// ==================== DEPOSIT ====================
		else if (subcommand === 'deposit') {
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
		}

		// ==================== PAY ====================
		else if (subcommand === 'pay') {
			await interaction.deferReply();

			try {
				const userToPay = interaction.options.getUser('user', true);
				const amount = interaction.options.getNumber('amount', true);
				const method =
					(interaction.options.getString('method') as 'balance' | 'bank') ??
					'balance';

				const receiver = await prisma.user.findUnique({
					where: { discord_id: userToPay.id },
				});
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
						label: replyLang(
							interaction.locale,
							'eco#pay#confirmation#decline',
						),
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

				collector.on('end', async (_, reason) => {
					if (reason === 'time') {
						const expiredEmbed = new EmbedBuilder()
							.setColor(Colors.Yellow)
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
		}

		// ==================== DAILY ====================
		else if (subcommand === 'daily') {
			await interaction.deferReply({ flags: ['Ephemeral'] });

			try {
				const dailyAmount = Math.floor(Math.random() * (30 - 5 + 1)) + 5;
				const result = await claimDaily(
					interaction.user.id,
					dailyAmount,
					interaction.locale,
				);

				const dailyEmbed = new EmbedBuilder()
					.setColor(result.bonus > 0 ? Colors.Gold : Colors.Yellow)
					.setAuthor({
						name: replyLang(interaction.locale, 'eco#daily#success#title'),
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setDescription(
						replyLang(interaction.locale, 'eco#daily#success#description'),
					)
					.addFields(
						{
							name: `🎁 ${replyLang(interaction.locale, 'eco#daily#success#reward')}`,
							value: `\`${dailyAmount.toLocaleString()}\` polens`,
							inline: true,
						},
						{
							name: `💰 ${replyLang(interaction.locale, 'eco#daily#success#balance')}`,
							value: `\`${result.balance.toLocaleString()}\` polens`,
							inline: true,
						},
					)
					.setThumbnail(interaction.user.displayAvatarURL({ size: 128 }))
					.setTimestamp()
					.setFooter({
						text: replyLang(interaction.locale, 'eco#balance#footer'),
						iconURL: client.user?.displayAvatarURL(),
					});

				if (result.bonus > 0) {
					dailyEmbed.addFields({
						name: `🔥 ${replyLang(interaction.locale, 'eco#daily#bonus#title')}`,
						value: replyLang(
							interaction.locale,
							'eco#daily#bonus#description',
							{
								bonus: result.bonus.toLocaleString(),
								streak: result.streakDays.toString(),
							},
						),
						inline: false,
					});
				} else if (result.streakDays > 1) {
					dailyEmbed.addFields({
						name: `📅 ${replyLang(interaction.locale, 'eco#daily#streak#title')}`,
						value: replyLang(
							interaction.locale,
							'eco#daily#streak#description',
							{
								streak: result.streakDays.toString(),
								remaining: (10 - result.streakDays).toString(),
							},
						),
						inline: false,
					});
				}

				await interaction.editReply({ embeds: [dailyEmbed] });
			} catch (error: any) {
				console.error('[daily] Error:', error);

				if (error.cooldown) {
					const cooldownEmbed = new EmbedBuilder()
						.setColor(Colors.Orange)
						.setAuthor({
							name: replyLang(interaction.locale, 'eco#daily#cooldown#title'),
							iconURL: interaction.user.displayAvatarURL(),
						})
						.setDescription(
							replyLang(interaction.locale, 'eco#daily#cooldown#description'),
						)
						.addFields({
							name: `🕐 ${replyLang(interaction.locale, 'eco#daily#nextClaim')}`,
							value: time(error.nextClaim, TimestampStyles.RelativeTime),
							inline: false,
						})
						.setTimestamp();

					await interaction.editReply({ embeds: [cooldownEmbed] });
				} else {
					const errorEmbed = createErrorEmbed(
						interaction.locale,
						replyLang(interaction.locale, 'eco#daily#error#title'),
						error.message || replyLang(interaction.locale, 'eco#error#generic'),
					);
					await interaction.editReply({ embeds: [errorEmbed] });
				}
			}
		}

		// ==================== LEADERBOARD ====================
		else if (subcommand === 'leaderboard') {
			await interaction.deferReply();

			try {
				const topUsers = await getLeaderboard(10);

				const leaderboardEmbed = new EmbedBuilder()
					.setColor(Colors.Gold)
					.setAuthor({
						name: replyLang(interaction.locale, 'eco#leaderboard#title'),
						iconURL: client.user?.displayAvatarURL(),
					})
					.setDescription(
						replyLang(interaction.locale, 'eco#leaderboard#description'),
					)
					.setTimestamp()
					.setFooter({
						text: replyLang(interaction.locale, 'eco#balance#footer'),
						iconURL: interaction.user.displayAvatarURL(),
					});

				if (topUsers.length === 0) {
					leaderboardEmbed.setDescription(
						replyLang(interaction.locale, 'eco#leaderboard#empty'),
					);
				} else {
					const medals = ['🥇', '🥈', '🥉'];
					const formatted = topUsers
						.map((user, index) => {
							const medal = medals[index] || `**${index + 1}.**`;
							return `${medal} <@${user.discord_id}> • \`${user.balance.toLocaleString()}\` polens`;
						})
						.join('\n');

					leaderboardEmbed.addFields({
						name: `👑 ${replyLang(interaction.locale, 'eco#leaderboard#ranking')}`,
						value: formatted,
						inline: false,
					});
				}

				await interaction.editReply({ embeds: [leaderboardEmbed] });
			} catch (error) {
				console.error('[leaderboard] Error:', error);
				const embed = createErrorEmbed(
					interaction.locale,
					replyLang(interaction.locale, 'eco#error#title'),
					replyLang(interaction.locale, 'eco#error#generic'),
				);
				await interaction.editReply({ embeds: [embed] });
			}
		}
	},
});
