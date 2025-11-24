// minecraft.ts
import { createCommand } from '@base';
import { prisma } from '@db';
import { mine } from '@menus/minecraft/mine.js';
import type { Transaction } from '@misc/types.js';
import crypto from 'crypto';
import { SlashCommandBuilder } from 'discord.js';

// Gerador de ID curto pra itens
function genItemId(len = 8) {
	return crypto.randomBytes(len).toString('hex');
}

export default createCommand({
	data: new SlashCommandBuilder()
		.setName('minecraft')
		.setDescription('Minecraft Subcommands')

		.addSubcommand((sub) =>
			sub
				.setName('mine')
				.setNameLocalizations({
					'pt-BR': 'minerar',
					'es-ES': 'mío',
				})
				.setDescription(
					'Mine minecraft ores but now on discord, and exchange for more things!',
				)
				.setDescriptionLocalizations({
					'pt-BR':
						'Minere minérios do Minecraft, mas agora no Discord e troque por mais coisas!',
					'es-ES':
						'¡Extrae minerales de Minecraft, pero ahora en Discord y cámbialos por más cosas!',
				})
				.addStringOption((opt) =>
					opt
						.setName('pickaxe')
						.setNameLocalizations({
							'es-ES': 'piqueta',
							'pt-BR': 'picareta',
						})
						.setDescription('Which pickaxe will you mine with?')
						.setDescriptionLocalizations({
							'es-ES': '¿Con qué pico minarás?',
							'pt-BR': 'Com qual picareta você vai minerar?',
						})
						.setAutocomplete(true)
						.setRequired(true),
				),
		)

		.addSubcommand((sub) =>
			sub
				.setName('start')
				.setNameLocalizations({
					'es-ES': 'empezar',
					'pt-BR': 'começar',
				})
				.setDescription('Start your Minecraft journey!')
				.setDescriptionLocalizations({
					'es-ES': '¡Comienza tu viaje en Minecraft!',
					'pt-BR': 'Comece sua jornada Minecraftiana!',
				}),
		),

	run: async (client, interaction) => {
		const sub = interaction.options.getSubcommand(true);

		if (sub === 'mine') {
			await mine(interaction);
		}

		if (sub === 'start') {
			const user = interaction.user;

			const userDB = await prisma.user.findUnique({
				where: { discord_id: user.id },
			});

			if (!userDB) {
				return interaction.reply({
					content:
						'❌ Você ainda não tem uma conta! Crie uma antes de começar sua jornada.',
					flags: ['Ephemeral'],
				});
			}

			// Inventário atual
			const backpack = (userDB.backpack as any[]) || [];

			// Verificar se já tem uma picareta inicial
			const hasStarter = backpack.some((i) => i.starter === true);
			if (hasStarter && interaction.user.id !== '878732372626006127') {
				return interaction.reply({
					content:
						'⚠️ Você já começou sua jornada e já tem sua picareta inicial!',
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

			await prisma.user.update({
				where: { discord_id: user.id },
				data: {
					backpack: [...backpack, starterPickaxe],
					transactions: [
						...((userDB.transactions as any[]) || []),
						newTransaction,
					],
				},
			});

			return interaction.reply(
				'🌟 Sua jornada começou! Você recebeu uma **Picareta de Madeira** para minerar!',
			);
		}
	},

	autocomplete: async (client, interaction) => {
		const sub = interaction.options.getSubcommand(true);
		if (sub !== 'mine') return;

		const user = interaction.user;
		const userDB = await prisma.user.findUnique({
			where: { discord_id: user.id },
		});

		if (!userDB?.backpack) {
			return interaction.respond([]);
		}

		const backpack = userDB.backpack as any[];
		const pickaxes = backpack.filter((i) => i.type === 'pickaxe');

		return interaction.respond(
			pickaxes.map((pk) => ({
				name: `${pk.name} (Durabilidade: ${pk.durability})`,
				value: pk.id,
			})),
		);
	},
});
