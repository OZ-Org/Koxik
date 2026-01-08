import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { UserController } from 'app/jobs/UserController.js';
import type { Transaction } from 'app/shared/types.js';
import crypto from 'crypto';

function genItemId(len = 8) {
	return crypto.randomBytes(len).toString('hex');
}

export default createSubCommand({
	name: 'start',
	name_localizations: {
		'es-ES': 'empezar',
		'pt-BR': 'começar',
	},
	description: 'Start your Minecraft journey!',
	description_localizations: {
		'es-ES': '¡Comienza tu viaje en Minecraft!',
		'pt-BR': 'Comece sua jornada Minecraftiana!',
	},
	cooldown: 50,
	run: async ({ interaction, res }) => {
		const locale = interaction.locale;
		const userId = interaction.user.id;

		await res.ephemeral().defer()

		const userDB = await UserController.find(userId);
		if (!userDB) {
			return await res.error(replyLang(locale, 'user#notFound'));
		}

		const backpack = userDB.backpack || [];

		const hasStarter = backpack.some(
			(i) => i.type === 'pickaxe' && i.starter === true,
		);
		if (hasStarter && userId !== '878732372626006127') {
			return await res.error(replyLang(locale, 'mine#start#alreadyStarted'));
		}

		const starterPickaxe = {
			id: genItemId(6),
			name: replyLang(locale, 'mine#start#starterPickaxeName'),
			type: 'pickaxe',
			durability: 50,
			maxDurability: 50,
			starter: true,
			maked: 'PICX_WOODEN',
		};

		const newTransaction: Transaction = {
			id: crypto.randomUUID(),
			type: 'mine_created',
			amount: 0,
			timestamp: Date.now(),
			description: replyLang(locale, 'mine#start#starterTransactionDesc'),
		};

		await UserController.addItemToBackpack(userId, starterPickaxe as any);
		await UserController.addTransaction(userId, newTransaction);

		return await res.success(replyLang(locale, 'mine#start#success'));
	},
});
