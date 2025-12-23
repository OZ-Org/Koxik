import { createSubCommand } from '@base';
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
	run: async ({ interaction }) => {
		const user = interaction.user;

		// UserController.get creates the user if they don't exist
		const userDB = await UserController.get(user.id);

		// Inventário atual
		const backpack = userDB.backpack || [];

		// Verificar se já tem uma picareta inicial
		const hasStarter = backpack.some(
			(i) => i.type === 'pickaxe' && i.starter === true,
		);
		if (hasStarter && interaction.user.id !== '878732372626006127') {
			return interaction.reply({
				content: '⚠️ Você já começou sua jornada e já tem sua picareta inicial!',
				flags: ['Ephemeral'],
			});
		}

		// Criar a picareta inicial
		const starterPickaxe = {
			id: genItemId(6), // id único e curto
			name: 'Picareta de Madeira',
			type: 'pickaxe',
			durability: 50,
			starter: true,
		};

		// Criar a transação
		const newTransaction: Transaction = {
			id: crypto.randomUUID(),
			type: 'mine_created',
			amount: 0,
			timestamp: Date.now(),
			description: 'Iniciou a jornada e recebeu a Picareta de Madeira',
		};

		await UserController.addItemToBackpack(user.id, starterPickaxe as any);
		await UserController.addTransaction(user.id, newTransaction);

		return interaction.reply(
			'🌟 Sua jornada começou! Você recebeu uma **Picareta de Madeira** para minerar!',
		);
	},
});
