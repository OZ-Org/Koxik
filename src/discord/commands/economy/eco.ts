import { createCommand } from '@base';
import { prisma } from '@db';
import { replyLang } from '@fx/utils/replyLang.js';
import {
	ActionRowBuilder,
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

async function getUserFullData(discordId: string) {
	const user = await prisma.user.findUnique({
		where: { discord_id: discordId },
	});
	if (!user) {
		return null;
	}

	const transactions: Transaction[] = parseTransactions(
		user.transactions as unknown,
	);
	return {
		balance: user.balance,
		bank: user.bank ?? 0,
		transactions,
	};
}

async function createUser(discordId: string) {
	return await prisma.user.create({
		data: {
			discord_id: discordId,
			balance: 0,
			bank: 0,
			transactions: [] as unknown as any,
		},
	});
}

async function addTransaction(
	discordId: string,
	transaction: Omit<Transaction, 'id'>,
) {
	const user = await prisma.user.findUnique({
		where: { discord_id: discordId },
	});
	if (!user) return;

	const transactions: Transaction[] = parseTransactions(
		user.transactions as unknown,
	);
	const newTransaction: Transaction = {
		...transaction,
		id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
	};

	transactions.unshift(newTransaction);
	if (transactions.length > 50) {
		transactions.splice(50);
	}
	await prisma.user.update({
		where: { discord_id: discordId },
		data: {
			transactions: transactions as unknown as any,
		},
	});
}

async function payUser(
	payerId: string,
	receiverId: string,
	amount: number,
	method: 'balance' | 'bank',
	locale: Locale,
) {
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
		throw new Error(replyLang(locale, 'eco#pay#error#payerNotFound'));
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
	if (sourceBalance < amount) {
		throw new Error(
			replyLang(locale, 'eco#pay#error#insufficientFunds', {
				amount: amount.toLocaleString(),
			}),
		);
	}

	const taxRate = method === 'bank' ? 0.1 : 0.025;
	const robberyChance = method === 'bank' ? 0.01 : 0.4;

	const tax = Math.floor(amount * taxRate);
	let received = amount;
	const totalCost = amount + tax;

	let robbed = false;
	let stolen = 0;
	if (Math.random() < robberyChance) {
		robbed = true;
		stolen = Math.floor(amount * 0.16);
		received = Math.max(0, amount - stolen);
	}

	if (method === 'bank') {
		const currentBank = payer.bank ?? 0;
		await prisma.user.update({
			where: { discord_id: payerId },
			data: { bank: { set: Math.max(0, currentBank - totalCost) } },
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
		description: `Sent ${amount.toLocaleString()} to user (fee: ${tax.toLocaleString()})`,
		to: receiverId,
	});

	await addTransaction(receiverId, {
		type: 'pay_received',
		amount: received,
		timestamp: Date.now(),
		description: `Received from user${robbed ? ` (${stolen.toLocaleString()} stolen)` : ''}`,
		from: payerId,
	});

	return {
		sent: amount,
		fee: tax,
		robbed,
		stolen,
		received,
		method,
	};
}

async function claimDaily(discordId: string, dailyAmount: number) {
	const now = new Date();
	let user = await prisma.user.findUnique({ where: { discord_id: discordId } });
	if (!user) {
		user = await createUser(discordId);
	}

	if (user.lastDaily && now.getTime() - user.lastDaily.getTime() < 86400000) {
		const nextClaim = new Date(user.lastDaily.getTime() + 86400000);
		throw { cooldown: true, nextClaim };
	}

	const transactions = parseTransactions(user.transactions as unknown);
	const dailyTransactions = transactions
		.filter((t) => t.type === 'daily')
		.slice(0, 10);

	let bonus = 0;
	let streakDays = 0;

	const oneDayMs = 86400000;
	let currentDate = now.getTime();

	for (const transaction of dailyTransactions) {
		const transactionDate = transaction.timestamp;
		const daysDiff = Math.floor((currentDate - transactionDate) / oneDayMs);

		if (daysDiff === 1) {
			streakDays++;
			currentDate = transactionDate;
		} else {
			break;
		}
	}

	if (streakDays >= 9) {
		bonus = Math.floor(dailyAmount * 2);
	}

	const totalReward = dailyAmount + bonus;

	user = await prisma.user.update({
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
		description: `Daily reward${bonus > 0 ? ` + ${bonus.toLocaleString()} streak bonus` : ''}`,
	});

	return { balance: user.balance, bonus, streakDays: streakDays + 1 };
}

async function depositMoney(discordId: string, amount: number, locale: Locale) {
	if (amount <= 0) {
		throw new Error(replyLang(locale, 'eco#deposit#error#invalidAmount'));
	}

	let user = await prisma.user.findUnique({ where: { discord_id: discordId } });

	if (!user) {
		user = await createUser(discordId);
	}

	if (user.balance < amount) {
		throw new Error(replyLang(locale, 'eco#deposit#error#insufficientFunds'));
	}

	try {
		const currentBank = user.bank ?? 0;
		const updatedUser = await prisma.user.update({
			where: { discord_id: discordId },
			data: {
				balance: { decrement: amount },
				bank: { set: currentBank + amount },
			},
		});

		await addTransaction(discordId, {
			type: 'deposit',
			amount,
			timestamp: Date.now(),
			description: `Deposited ${amount.toLocaleString()} polens to bank`,
		});

		return {
			deposited: amount,
			newBalance: updatedUser.balance,
			newBank: updatedUser.bank ?? 0,
		};
	} catch (error) {
		console.error('DEPOSIT ERROR', error);
		throw new Error(`Erro ao fazer depósito: ${error}`);
	}
}

async function getLeaderboard(limit = 3) {
	return prisma.user.findMany({
		orderBy: { balance: 'desc' },
		take: limit,
		select: { discord_id: true, balance: true },
	});
}

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
				.setNameLocalizations({ 'pt-BR': 'saldo', 'es-ES': 'saldo' })
				.setDescriptionLocalizations({
					'pt-BR': 'Veja sua bufunfa',
					'es-ES': 'Ver tu dinero',
				})
				.addUserOption((user) =>
					user
						.setName('user')
						.setDescription('Which user will see the balance?')
						.setNameLocalizations({ 'pt-BR': 'usuario', 'es-ES': 'usuario' })
						.setDescriptionLocalizations({
							'pt-BR': 'Qual será o usuário que será visto o saldo?',
							'es-ES': '¿Qué usuario verá el saldo?',
						}),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('deposit')
				.setDescription('Deposit money to your bank')
				.setNameLocalizations({ 'pt-BR': 'depositar', 'es-ES': 'depositar' })
				.setDescriptionLocalizations({
					'pt-BR': 'Deposite dinheiro no seu banco',
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
							'pt-BR': 'Quantidade de polens para depositar',
							'es-ES': 'Cantidad de polens a depositar',
						})
						.setRequired(true),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('pay')
				.setDescription('Pay another user')
				.setNameLocalizations({ 'pt-BR': 'pagar', 'es-ES': 'pagar' })
				.setDescriptionLocalizations({
					'pt-BR': 'Pague outro usuário',
					'es-ES': 'Paga a otro usuario',
				})
				.addUserOption((opt) =>
					opt
						.setName('user')
						.setDescription('User to pay')
						.setNameLocalizations({ 'pt-BR': 'usuario', 'es-ES': 'usuario' })
						.setDescriptionLocalizations({
							'pt-BR': 'Usuário que vai receber o pagamento',
							'es-ES': 'Usuario que recibirá el pago',
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
							'pt-BR': 'Quantidade de polens para pagar',
							'es-ES': 'Cantidad de dinero a pagar',
						})
						.setRequired(true),
				)
				.addStringOption((opt) =>
					opt
						.setName('method')
						.setDescription('Method by which the transfer will be carried out?')
						.setNameLocalizations({ 'es-ES': 'método', 'pt-BR': 'método' })
						.setDescriptionLocalizations({
							'pt-BR': 'Método pelo qual a transferência será realizada?',
							'es-ES': 'Método por el cual se realizará la transferencia?',
						})
						.addChoices(
							{
								name: 'Wallet',
								value: 'balance',
								name_localizations: { 'pt-BR': 'Carteira', 'es-ES': 'Cartera' },
							},
							{
								name: 'Bank',
								value: 'bank',
								name_localizations: { 'pt-BR': 'Banco', 'es-ES': 'Banco' },
							},
						),
				),
		)
		.addSubcommand((sub) =>
			sub
				.setName('daily')
				.setDescription('Claim your daily reward')
				.setNameLocalizations({ 'pt-BR': 'daily', 'es-ES': 'diario' })
				.setDescriptionLocalizations({
					'pt-BR': 'Pegue sua recompensa diária',
					'es-ES': 'Reclama tu recompensa diaria',
				}),
		)
		.addSubcommand((sub) =>
			sub
				.setName('leaderboard')
				.setDescription('Check the richest users')
				.setNameLocalizations({ 'pt-BR': 'ranking', 'es-ES': 'ranking' })
				.setDescriptionLocalizations({
					'pt-BR': 'Veja os usuários mais ricos',
					'es-ES': 'Ve los usuarios más ricos',
				}),
		),

	run: async (client, interaction) => {
		const discordUserID = interaction.user.id;

		async function balanceLogic() {
			await interaction.deferReply({ flags: ['Ephemeral'] });
			const userToSee = interaction.options.getUser('user') ?? interaction.user;

			if (userToSee.id !== interaction.user.id) {
				const userData = await getUserFullData(userToSee.id);
				if (!userData) {
					const embed = new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle(
							`❌ ${replyLang(interaction.locale, 'eco#balance#userNotFound#title')}`,
						)
						.setDescription(
							replyLang(
								interaction.locale,
								'eco#balance#userNotFound#description',
								{
									user: userToSee.displayName,
								},
							),
						)
						.setTimestamp();

					await interaction.editReply({ embeds: [embed] });
					return;
				}

				const embed = new EmbedBuilder()
					.setColor(Colors.Gold)
					.setTitle(`💰 ${replyLang(interaction.locale, 'eco#balance#title')}`)
					.setDescription(`**${userToSee.displayName}**`)
					.addFields(
						{
							name: `🏦 ${replyLang(interaction.locale, 'eco#balance#wallet')}`,
							value: `\`${userData.balance.toLocaleString()}\` polens`,
							inline: true,
						},
						{
							name: `🏛️ ${replyLang(interaction.locale, 'eco#balance#bank')}`,
							value: `\`${userData.bank.toLocaleString()}\` polens`,
							inline: true,
						},
						{
							name: `💎 ${replyLang(interaction.locale, 'eco#balance#total')}`,
							value: `\`${(userData.balance + userData.bank).toLocaleString()}\` polens`,
							inline: false,
						},
					)
					.setThumbnail(userToSee.displayAvatarURL())
					.setTimestamp()
					.setFooter({
						text: `${replyLang(interaction.locale, 'eco#balance#footer')}`,
						iconURL: client.user?.displayAvatarURL(),
					});

				await interaction.editReply({ embeds: [embed] });
				return;
			}

			let userData = await getUserFullData(userToSee.id);
			if (!userData) userData = { balance: 0, bank: 0, transactions: [] };

			const addAll = userData?.balance + userData?.bank;

			const embed = new EmbedBuilder()
				.setColor(Colors.Gold)
				.setTitle(`💰 ${replyLang(interaction.locale, 'eco#balance#title')}`)
				.setDescription(`**${userToSee.displayName}**`)
				.addFields(
					{
						name: `🏦 ${replyLang(interaction.locale, 'eco#balance#wallet')}`,
						value: `\`${userData?.balance.toLocaleString()}\` polens`,
						inline: true,
					},
					{
						name: `🏛️ ${replyLang(interaction.locale, 'eco#balance#bank')}`,
						value: `\`${userData?.bank.toLocaleString()}\` polens`,
						inline: true,
					},
					{
						name: `💎 ${replyLang(interaction.locale, 'eco#balance#total')}`,
						value: `\`${addAll.toLocaleString()}\` polens`,
						inline: false,
					},
				)
				.setThumbnail(userToSee.displayAvatarURL())
				.setTimestamp()
				.setFooter({
					text: `${replyLang(interaction.locale, 'eco#balance#footer')}`,
					iconURL: client.user?.displayAvatarURL(),
				});

			await interaction.editReply({ embeds: [embed] });
		}

		async function depositLogic() {
			await interaction.deferReply();
			const amount = interaction.options.getNumber('amount', true);

			try {
				const result = await depositMoney(
					discordUserID,
					amount,
					interaction.locale,
				);

				const embed = new EmbedBuilder()
					.setColor(Colors.Green)
					.setTitle(
						`🏦 ${replyLang(interaction.locale, 'eco#deposit#success#title')}`,
					)
					.setDescription(
						replyLang(interaction.locale, 'eco#deposit#success#description', {
							amount: result?.deposited.toLocaleString(),
						}),
					)
					.addFields(
						{
							name: `💰 ${replyLang(interaction.locale, 'eco#deposit#success#newBalance')}`,
							value: `\`${result?.newBalance?.toLocaleString()}\` polens`,
							inline: true,
						},
						{
							name: `🏛️ ${replyLang(interaction.locale, 'eco#deposit#success#newBank')}`,
							value: `\`${result?.newBank.toLocaleString()}\` polens`,
							inline: true,
						},
					)
					.setTimestamp();

				await interaction.editReply({ embeds: [embed] });
			} catch (err: any) {
				const errorEmbed = new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle(
						`❌ ${replyLang(interaction.locale, 'eco#deposit#error#title')}`,
					)
					.setDescription(err.message)
					.setTimestamp();

				await interaction.editReply({ embeds: [errorEmbed] });
			}
		}

		async function payLogic() {
			await interaction.deferReply();

			const userToPay = interaction.options.getUser('user', true);
			const moneyToPay = interaction.options.getNumber('amount', true);
			const method =
				(interaction.options.getString('method') as 'balance' | 'bank') ??
				'balance';
			const receiver = await prisma.user.findUnique({
				where: { discord_id: userToPay.id },
			});

			if (!receiver) {
				const errorEmbed = new EmbedBuilder()
					.setColor(Colors.Red)
					.setTitle(
						`❌ ${replyLang(interaction.locale, 'eco#pay#error#title')}`,
					)
					.setDescription(
						replyLang(interaction.locale, 'eco#pay#error#receiverNotFound', {
							user: userToPay.username,
						}),
					)
					.setTimestamp();

				await interaction.editReply({ embeds: [errorEmbed] });
				return;
			}

			let payerData = await getUserFullData(interaction.user.id);
			if (!payerData) {
				payerData = await getUserFullData(interaction.user.id);
				return;
			}

			const sourceBalance =
				method === 'bank' ? payerData.bank : payerData.balance;
			const taxRate = method === 'bank' ? 0.1 : 0.025;
			const robberyChance = method === 'bank' ? 0.01 : 0.4;
			const tax = Math.floor(moneyToPay * taxRate);
			const totalCost = moneyToPay + tax;

			const infoEmbed = new EmbedBuilder()
				.setColor(Colors.Blue)
				.setTitle(
					`💸 ${replyLang(interaction.locale, 'eco#pay#confirmation#title')}`,
				)
				.setDescription(
					replyLang(interaction.locale, 'eco#pay#confirmation#description', {
						payer: interaction.user.displayName,
						receiver: userToPay.displayName,
						amount: moneyToPay.toLocaleString(),
						method: replyLang(interaction.locale, `eco#pay#method#${method}`),
					}),
				)
				.addFields(
					{
						name: `📊 ${replyLang(interaction.locale, 'eco#pay#details#title')}`,
						value: [
							`**${replyLang(interaction.locale, 'eco#pay#details#amount')}:** \`${moneyToPay.toLocaleString()}\` polens`,
							`**${replyLang(interaction.locale, 'eco#pay#details#fee')}:** \`${tax.toLocaleString()}\` polens (${(taxRate * 100).toFixed(1)}%)`,
							`**${replyLang(interaction.locale, 'eco#pay#details#total')}:** \`${totalCost.toLocaleString()}\` polens`,
							`**${replyLang(interaction.locale, 'eco#pay#details#robbery')}:** ${(robberyChance * 100).toFixed(1)}%`,
						].join('\n'),
						inline: false,
					},
					{
						name: `🏦 ${replyLang(interaction.locale, 'eco#pay#method#wallet')}`,
						value: replyLang(
							interaction.locale,
							'eco#pay#method#walletDescription',
						),
						inline: true,
					},
					{
						name: `🏛️ ${replyLang(interaction.locale, 'eco#pay#method#bank')}`,
						value: replyLang(
							interaction.locale,
							'eco#pay#method#bankDescription',
						),
						inline: true,
					},
					{
						name: `💰 ${replyLang(interaction.locale, 'eco#pay#balance#current')}`,
						value: `\`${sourceBalance.toLocaleString()}\` polens`,
						inline: false,
					},
				)
				.setThumbnail(userToPay.displayAvatarURL())
				.setTimestamp()
				.setFooter({
					text: `${replyLang(interaction.locale, 'eco#pay#footer')} • ${time(new Date(Date.now() + 5 * 60 * 1000), TimestampStyles.RelativeTime)}`,
					iconURL: interaction.user.displayAvatarURL(),
				});

			if (sourceBalance < totalCost) {
				infoEmbed
					.setColor(Colors.Red)
					.setTitle(
						`❌ ${replyLang(interaction.locale, 'eco#pay#error#title')}`,
					)
					.setDescription(
						replyLang(interaction.locale, 'eco#pay#error#insufficientFunds', {
							amount: totalCost.toLocaleString(),
						}),
					);

				await interaction.editReply({ embeds: [infoEmbed] });
				return;
			}

			const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId('accept')
					.setLabel(
						replyLang(interaction.locale, 'eco#pay#confirmation#accept'),
					)
					.setStyle(ButtonStyle.Success)
					.setEmoji('✅'),
				new ButtonBuilder()
					.setCustomId('decline')
					.setLabel(
						replyLang(interaction.locale, 'eco#pay#confirmation#decline'),
					)
					.setStyle(ButtonStyle.Danger)
					.setEmoji('❌'),
			);

			const msg = await interaction.editReply({
				embeds: [infoEmbed],
				components: [row],
			});

			const collector = msg.createMessageComponentCollector({
				componentType: ComponentType.Button,
				time: 5 * 60 * 1000, // 5 min
			});

			collector.on('collect', async (i) => {
				if (i.user.id !== userToPay.id) {
					const errorEmbed = new EmbedBuilder()
						.setColor(Colors.Red)
						.setDescription(
							replyLang(interaction.locale, 'eco#pay#error#notReceiver'),
						)
						.setTimestamp();

					await i.reply({
						embeds: [errorEmbed],
						flags: ['Ephemeral'],
					});
					return;
				}

				if (i.customId === 'accept') {
					try {
						const result = await payUser(
							interaction.user.id,
							userToPay.id,
							moneyToPay,
							method,
							interaction.locale,
						);

						const successEmbed = new EmbedBuilder()
							.setColor(result.robbed ? Colors.Orange : Colors.Green)
							.setTitle(
								`✅ ${replyLang(interaction.locale, 'eco#pay#success#title')}`,
							)
							.setDescription(
								replyLang(interaction.locale, 'eco#pay#success#description', {
									payer: interaction.user.displayName,
									receiver: userToPay.displayName,
								}),
							)
							.addFields(
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
							)
							.setTimestamp();

						if (result.robbed) {
							successEmbed
								.addFields({
									name: `🦹 ${replyLang(interaction.locale, 'eco#pay#success#robbed')}`,
									value: replyLang(
										interaction.locale,
										'eco#pay#success#robbedDescription',
										{
											stolen: result.stolen.toLocaleString(),
										},
									),
									inline: false,
								})
								.setColor(Colors.Orange);
						}

						await i.update({
							embeds: [successEmbed],
							components: [],
						});
					} catch (err: any) {
						const errorEmbed = new EmbedBuilder()
							.setColor(Colors.Red)
							.setTitle(
								`❌ ${replyLang(interaction.locale, 'eco#pay#error#title')}`,
							)
							.setDescription(err.message)
							.setTimestamp();

						await i.update({
							embeds: [errorEmbed],
							components: [],
						});
					}
					collector.stop('done');
				} else if (i.customId === 'decline') {
					const declineEmbed = new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle(
							`❌ ${replyLang(interaction.locale, 'eco#pay#declined#title')}`,
						)
						.setDescription(
							replyLang(interaction.locale, 'eco#pay#declined', {
								payer: interaction.user.displayName,
								receiver: userToPay.displayName,
							}),
						)
						.setTimestamp();

					await i.update({
						embeds: [declineEmbed],
						components: [],
					});
					collector.stop('declined');
				}
			});

			collector.on('end', async (_, reason) => {
				if (reason === 'time') {
					const expiredEmbed = new EmbedBuilder()
						.setColor(Colors.Yellow)
						.setTitle(
							`⏰ ${replyLang(interaction.locale, 'eco#pay#expired#title')}`,
						)
						.setDescription(
							replyLang(interaction.locale, 'eco#pay#expired', {
								payer: interaction.user.displayName,
								receiver: userToPay.displayName,
							}),
						)
						.setTimestamp();

					await msg.edit({
						embeds: [expiredEmbed],
						components: [],
					});
				}
			});
		}

		async function dailyLogic() {
			await interaction.deferReply({ flags: ['Ephemeral'] });
			const dailyAmount = Math.floor(Math.random() * (30 - 5 + 1)) + 5;

			try {
				const result = await claimDaily(discordUserID, dailyAmount);

				const dailyEmbed = new EmbedBuilder()
					.setColor(Colors.Yellow)
					.setTitle(
						`🌞 ${replyLang(interaction.locale, 'eco#daily#success#title')}`,
					)
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
					.setThumbnail(interaction.user.displayAvatarURL())
					.setTimestamp();

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
					dailyEmbed.setColor(Colors.Gold);
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
			} catch (err: any) {
				if (err.cooldown) {
					const cooldownEmbed = new EmbedBuilder()
						.setColor(Colors.Orange)
						.setTitle(
							`⏳ ${replyLang(interaction.locale, 'eco#daily#cooldown#title')}`,
						)
						.setDescription(
							replyLang(interaction.locale, 'eco#daily#cooldown#description'),
						)
						.addFields({
							name: `🕐 ${replyLang(interaction.locale, 'eco#daily#nextClaim')}`,
							value: time(err.nextClaim, TimestampStyles.RelativeTime),
							inline: false,
						})
						.setTimestamp();

					await interaction.editReply({ embeds: [cooldownEmbed] });
				} else {
					const errorEmbed = new EmbedBuilder()
						.setColor(Colors.Red)
						.setTitle(
							`❌ ${replyLang(interaction.locale, 'eco#daily#error#title')}`,
						)
						.setDescription(err.message)
						.setTimestamp();

					await interaction.editReply({ embeds: [errorEmbed] });
				}
			}
		}

		async function leaderboardLogic() {
			await interaction.deferReply();
			const topUsers = await getLeaderboard(10);

			const leaderboardEmbed = new EmbedBuilder()
				.setColor(Colors.Gold)
				.setTitle(
					`🏆 ${replyLang(interaction.locale, 'eco#leaderboard#title')}`,
				)
				.setDescription(
					replyLang(interaction.locale, 'eco#leaderboard#description'),
				)
				.setTimestamp();

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
		}

		const subcommand = interaction.options.getSubcommand(true);
		const handlers: Record<string, () => Promise<void>> = {
			balance: balanceLogic,
			deposit: depositLogic,
			pay: payLogic,
			daily: dailyLogic,
			leaderboard: leaderboardLogic,
		};
		await (handlers[subcommand]?.() ?? Promise.resolve());
	},
});
