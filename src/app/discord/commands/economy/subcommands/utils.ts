import { replyLang } from '@fx/utils/replyLang.js';
import { Colors, EmbedBuilder, type Locale } from 'discord.js';
import { UserController } from '../../../../jobs/UserController.js';
import type {
	DailyResult,
	PaymentResult,
	Transaction,
	UserData,
} from '../../../../shared/types.js';

export function generateTransactionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function createErrorEmbed(
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

export function createSuccessEmbed(
	title: string,
	description: string,
): EmbedBuilder {
	return new EmbedBuilder()
		.setColor(Colors.Green)
		.setTitle(`✅ ${title}`)
		.setDescription(description)
		.setTimestamp();
}

export async function getUserFullData(
	discordId: string,
): Promise<UserData | null> {
	try {
		const user = await UserController.get(discordId);

		return {
			balance: user.balance,
			bank: user.bank ?? 0,
			transactions: (user.transactions as Transaction[]) || [],
		};
	} catch (error) {
		console.error('[getUserFullData] Error:', error);
		throw error;
	}
}

export async function payUser(
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

	const payer = await UserController.get(payerId);
	const receiver = await UserController.get(receiverId);

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

	try {
		if (method === 'bank') {
			await UserController.update(payerId, {
				bank: (payer.bank ?? 0) - totalCost,
			});
		} else {
			await UserController.removeBalance(payerId, totalCost);
		}

		await UserController.addBalance(receiverId, received);

		await UserController.addTransaction(payerId, {
			id: generateTransactionId(),
			type: 'pay_sent',
			amount: -totalCost,
			timestamp: Date.now(),
			description: `Sent ${amount.toLocaleString()} (fee: ${tax.toLocaleString()})`,
			to: receiverId,
		});

		await UserController.addTransaction(receiverId, {
			id: generateTransactionId(),
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

export async function claimDaily(
	discordId: string,
	dailyAmount: number,
	locale: Locale,
): Promise<DailyResult> {
	const now = new Date();
	const user = await UserController.get(discordId);

	if (user.lastDaily) {
		const lastDailyDate = new Date(user.lastDaily);
		if (now.getTime() - lastDailyDate.getTime() < 86400000) {
			const nextClaim = new Date(lastDailyDate.getTime() + 86400000);
			throw { cooldown: true, nextClaim };
		}
	}

	const transactions = (user.transactions as Transaction[]) || [];
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
		await UserController.addBalance(discordId, totalReward);
		const updatedUser = await UserController.update(discordId, {
			lastDaily: now.toISOString(),
		});

		await UserController.addTransaction(discordId, {
			id: generateTransactionId(),
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

export async function depositMoney(
	discordId: string,
	amount: number,
	locale: Locale,
) {
	if (amount <= 0) {
		throw new Error(replyLang(locale, 'eco#deposit#error#invalidAmount'));
	}

	const user = await UserController.get(discordId);

	if (user.balance < amount) {
		throw new Error(replyLang(locale, 'eco#deposit#error#insufficientFunds'));
	}

	try {
		await UserController.removeBalance(discordId, amount);
		const updatedUser = await UserController.update(discordId, {
			bank: (user.bank ?? 0) + amount,
		});

		await UserController.addTransaction(discordId, {
			id: generateTransactionId(),
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

export async function getLeaderboard(limit = 10) {
	try {
		const users = await UserController.getLeaderboard(limit);
		return users.map((u) => ({ discord_id: u.discordId, balance: u.balance }));
	} catch (error) {
		console.error('[getLeaderboard] Error:', error);
		throw error;
	}
}
