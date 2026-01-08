import { randomInt, randomUUID } from 'node:crypto';

import { replyLang } from '@fx/utils/replyLang.js';

import { createRow, EmbedPlusBuilder } from '@magicyan/discord';

import type { BackpackItem, BackpackType, OreType } from 'app/shared/types.js';

import {
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	ComponentType,
	type Locale,
} from 'discord.js';

import { UserController } from '../../jobs/UserController.js';

interface LootboxDrop {
	id: string;

	type: 'lootbox';

	rarity: LootboxRarity;

	name: string;
}

// Configuração das lootboxes

const LOOTBOX_CONFIG = {
	common: {
		name: 'Caixa Comum',
		color: 9807270,
		dropChance: 2,
		rarity: 'common',
		emoji: '📦',
	},
	rare: {
		name: 'Caixa Rara',
		color: 0xffd700,
		dropChance: 1,
		rarity: 'rare',
		emoji: '🎁',
	},
	epic: {
		name: 'Caixa Épica',
		color: 0xff00ff,
		dropChance: 0.5,
		rarity: 'epic',
		emoji: '🛸',
	},
} as const;

type LootboxRarity = keyof typeof LOOTBOX_CONFIG;

function progressBar(current: number, max: number, size = 12) {
	const filled = Math.round((current / max) * size);

	const empty = size - filled;

	return `[${'🟩'.repeat(filled)}${'🟥'.repeat(empty)}] ${current}/${max}`;
}

function generateOre(
	pickaxe: Extract<BackpackItem, { type: 'pickaxe' }>,
): OreType {
	const ores = pickaxe.ores ?? ['stone'];

	const roll = randomInt(1, 101);

	let cum = 0;

	for (const ore of ores) {
		cum += pickaxe.rates?.[ore] ?? 0;

		if (roll <= cum) return ore;
	}

	return 'stone';
}

// Função para verificar se dropou uma lootbox

function checkLootboxDrop(): LootboxDrop | null {
	const roll = randomInt(1, 101);

	// Apenas common por enquanto com 2% de chance

	if (roll <= LOOTBOX_CONFIG.common.dropChance) {
		return {
			id: `lootbox_${randomUUID()}`,

			type: 'lootbox',

			rarity: 'common',

			name: LOOTBOX_CONFIG.common.name,
		};
	}

	return null;
}

async function handleLava(
	interaction: ChatInputCommandInteraction,

	locale: Locale,

	durability: number,
): Promise<number> {
	const lavaMsg = await interaction.followUp({
		content: `🌋 ${replyLang(locale, 'mine#lava_appears')}`,

		components: [
			createRow(
				new ButtonBuilder()

					.setCustomId('jump')

					.setLabel('🔥 PULAR!')

					.setStyle(ButtonStyle.Danger),
			),
		],

		flags: ['Ephemeral'],
	});

	let jumped = false;

	const collector = lavaMsg.createMessageComponentCollector({
		componentType: ComponentType.Button,

		time: 3000,
	});

	collector.on('collect', async (i) => {
		if (i.customId === 'jump') {
			jumped = true;

			await i.reply({
				content: replyLang(locale, 'mine#lava_jump_success'),

				flags: ['Ephemeral'],
			});

			await lavaMsg.delete().catch(() => {});
		}
	});

	collector.on('end', async () => {
		if (!jumped) {
			durability = Math.max(0, durability - 2);

			await interaction

				.followUp({
					content: replyLang(locale, 'mine#lava_jump_fail'),

					flags: ['Ephemeral'],
				})

				.catch(() => {});

			await lavaMsg.delete().catch(() => {});
		}
	});

	return new Promise<number>((resolve) => {
		collector.on('end', () => resolve(durability));
	});
}

export async function mine(interaction: ChatInputCommandInteraction) {
	const user = interaction.user;

	const pickaxeId = interaction.options.getString('pickaxe', true);

	const locale = interaction.locale ?? 'pt-BR';

	const userDB = await UserController.find(user.id);
	if (!userDB) throw new Error(replyLang(locale, 'user#notFound'));
	if (!userDB?.backpack)
		return interaction.reply({
			content: replyLang(locale, 'mine#no_backpack'),

			flags: ['Ephemeral'],
		});

	const backpack = userDB.backpack as BackpackType;

	const pickaxe = backpack.find(
		(i) => i.type === 'pickaxe' && i.id === pickaxeId,
	) as Extract<BackpackItem, { type: 'pickaxe' }> | undefined;

	if (!pickaxe)
		return interaction.reply({
			content: replyLang(locale, 'mine#pickaxe_not_found'),

			flags: ['Ephemeral'],
		});

	if (pickaxe.durability <= 0)
		return interaction.reply({
			content: replyLang(locale, 'mine#pickaxe_broken'),

			flags: ['Ephemeral'],
		});

	let durability = pickaxe.durability;

	const maxDurability = pickaxe.durability;

	let loot: Partial<Record<OreType, number>> = {};

	const lootboxes: LootboxDrop[] = [];

	let mining = true;

	let pickaxeBroke = false;

	const embed = new EmbedPlusBuilder({
		title: replyLang(locale, 'mine#mining_start'),

		color: 0x2ecc71,

		description: replyLang(locale, 'mine#mining_progress'),

		fields: [
			{
				name: `${replyLang(locale, 'mine#durability_field')} ⚒️`,

				value: progressBar(durability, maxDurability),

				inline: false,
			},

			{
				name: `${replyLang(locale, 'mine#loot_field')} 💎`,

				value: replyLang(locale, 'mine#none_yet'),

				inline: false,
			},
		],

		footer: { text: `👤 ${user.username}` },
	});

	const stopRow = createRow(
		new ButtonBuilder()

			.setCustomId('stop')

			.setLabel(replyLang(locale, 'mine#stop_button'))

			.setStyle(ButtonStyle.Danger),
	);

	await interaction.reply({ embeds: [embed], components: [stopRow] });

	const msg = await interaction.fetchReply();

	const collector = msg.createMessageComponentCollector({
		componentType: ComponentType.Button,

		time: 60000,
	});

	collector.on('collect', async (i) => {
		if (i.user.id !== user.id)
			return i.reply({
				content: replyLang(locale, 'mine#not_your_button'),

				flags: ['Ephemeral'],
			});

		if (i.customId === 'stop') {
			mining = false;

			collector.stop('user_stop');

			await msg.edit({ components: [] }).catch(() => {});

			await i.reply({
				content: replyLang(locale, 'mine#mining_stop'),

				flags: ['Ephemeral'],
			});
		}
	});

	async function saveLoot() {
		const updatedBackpack = backpack.map((i) =>
			i.type === 'pickaxe' && i.id === pickaxe!.id ? { ...i, durability } : i,
		) as BackpackType;

		// Adicionar minérios

		for (const [ore, qty] of Object.entries(loot)) {
			if (!qty) continue;

			const existingOreIndex = updatedBackpack.findIndex(
				(item) => item.type === 'ore' && item.name === ore,
			);

			if (existingOreIndex !== -1) {
				const existingItem = updatedBackpack[existingOreIndex];

				if (existingItem.type === 'ore') {
					updatedBackpack[existingOreIndex] = {
						...existingItem,

						amount: existingItem.amount + qty,
					};
				}
			} else {
				updatedBackpack.push({
					id: `${ore}_${randomUUID()}`,

					type: 'ore',

					name: ore as OreType,

					amount: qty,
				});
			}
		}

		// Adicionar lootboxes

		for (const lootbox of lootboxes) {
			updatedBackpack.push(lootbox as any);
		}

		await UserController.update(user.id, { backpack: updatedBackpack });
	}

	async function processMiningCycle(_tick: number): Promise<boolean> {
		await new Promise((res) => setTimeout(res, 1000));

		// Evento aleatório: lava

		if (randomInt(1, 25) === 13) {
			durability = await handleLava(interaction, locale, durability);
		}

		if (!pickaxe) {
			mining = false;

			return false;
		}

		// Gerar minério

		const ore = generateOre(pickaxe);

		loot[ore] = (loot[ore] ?? 0) + 1;

		// Verificar drop de lootbox

		const lootboxDrop = checkLootboxDrop();

		if (lootboxDrop) {
			lootboxes.push(lootboxDrop);

			// Notificar o usuário sobre o drop

			await interaction
				.followUp({
					content: `🎉 **LOOTBOX ENCONTRADA!** ${LOOTBOX_CONFIG.common.emoji} ${LOOTBOX_CONFIG.common.name}`,

					flags: ['Ephemeral'],
				})
				.catch(() => {});
		}

		durability = Math.max(0, durability - 1);

		// Formatar loot

		const formattedLoot =
			Object.entries(loot)

				.map(([o, q]) => `• ${q}x **${o}**`)

				.join('\n') || replyLang(locale, 'mine#none_yet');

		// Adicionar lootboxes ao display

		const lootboxDisplay =
			lootboxes.length > 0
				? `\n\n**🎁 Lootboxes:**\n${lootboxes.map((lb) => `• ${LOOTBOX_CONFIG[lb.rarity].emoji} ${lb.name}`).join('\n')}`
				: '';

		embed.setFields(
			{
				name: `${replyLang(locale, 'mine#durability_field')} ⚒️`,

				value: progressBar(durability, maxDurability),
			},

			{
				name: `${replyLang(locale, 'mine#loot_field')} 💎`,

				value: formattedLoot + lootboxDisplay,
			},
		);

		embed

			.setColor(0x27ae60)

			.setFooter({ text: replyLang(locale, 'mine#progress_footer') });

		if (mining && durability > 0) {
			await msg

				.edit({ embeds: [embed], components: [stopRow] })

				.catch(() => {});
		} else {
			await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
		}

		if (durability <= 0) {
			mining = false;

			pickaxeBroke = true;

			return false;
		}

		return mining;
	}

	let tick = 0;

	while (tick < 20 && mining) {
		const shouldContinue = await processMiningCycle(tick);

		if (!shouldContinue) break;

		tick++;
	}

	if (collector && !collector.ended) {
		collector.stop('mining_complete');
	}

	await saveLoot();

	if (pickaxeBroke) {
		const lootboxDisplay =
			lootboxes.length > 0 ? `\n\n**🎁 Lootboxes:** ${lootboxes.length}x` : '';

		const breakEmbed = new EmbedPlusBuilder({
			title: `💥 ${replyLang(locale, 'mine#pickaxe_broken_title')}`,

			description: replyLang(locale, 'mine#pickaxe_broken_desc'),

			color: 0xe74c3c,

			fields: [
				{
					name: replyLang(locale, 'mine#loot_field'),

					value:
						(Object.entries(loot)

							.map(([o, q]) => `• ${q}x **${o}**`)

							.join('\n') || replyLang(locale, 'mine#none_yet')) +
						lootboxDisplay,
				},
			],

			footer: {
				text: `⚒️ ${replyLang(locale, 'mine#durability_field')}: ${durability}/${maxDurability}`,
			},
		});

		await msg.edit({ embeds: [breakEmbed], components: [] }).catch(() => {});

		return;
	}

	const lootboxDisplay =
		lootboxes.length > 0 ? `\n\n**🎁 Lootboxes:** ${lootboxes.length}x` : '';

	const endEmbed = new EmbedPlusBuilder({
		title: `✅ ${replyLang(locale, 'mine#mining_complete')}`,

		description: replyLang(locale, 'mine#choose_loot_action'),

		color: 0x3498db,

		fields: [
			{
				name: replyLang(locale, 'mine#loot_field'),

				value:
					(Object.entries(loot)

						.map(([o, q]) => `• ${q}x **${o}**`)

						.join('\n') || replyLang(locale, 'mine#none_yet')) + lootboxDisplay,
			},
		],

		footer: {
			text: `⚒️ ${replyLang(locale, 'mine#durability_field')}: ${durability}/${maxDurability}`,
		},
	});

	const lootRow = createRow(
		new ButtonBuilder()

			.setCustomId('keep')

			.setLabel(replyLang(locale, 'mine#keep_loot'))

			.setStyle(ButtonStyle.Success),

		new ButtonBuilder()

			.setCustomId('burn')

			.setLabel(replyLang(locale, 'mine#burn_loot'))

			.setStyle(ButtonStyle.Danger),
	);

	await msg.edit({ embeds: [endEmbed], components: [lootRow] }).catch(() => {});

	const lootCollector = msg.createMessageComponentCollector({
		componentType: ComponentType.Button,

		time: 20000,
	});

	lootCollector.on('collect', async (i) => {
		if (i.user.id !== user.id)
			return i.reply({
				content: replyLang(locale, 'mine#not_your_button'),

				flags: ['Ephemeral'],
			});

		let finalEmbed: EmbedPlusBuilder;

		if (i.customId === 'keep') {
			finalEmbed = new EmbedPlusBuilder({
				title: replyLang(locale, 'mine#loot_saved_title'),

				description: replyLang(locale, 'mine#loot_saved_desc'),

				color: 0x2ecc71,

				footer: { text: `✅ ${replyLang(locale, 'mine#mining_complete')}` },
			});
		} else {
			const updatedBackpack = await UserController.getBackpack(user.id);

			const filteredBackpack = updatedBackpack.filter((item) => {
				if (item.type === 'ore') {
					return !Object.keys(loot).includes(item.name);
				}
				type Thing = 'pickaxe' | 'lootbox';

				const t: Thing = 'pickaxe';
				const i: Thing = 'lootbox';

				if ((t as string) === (i as string)) {
					return true;
				}

				return true;
			});

			await UserController.update(user.id, { backpack: filteredBackpack });

			loot = {};

			finalEmbed = new EmbedPlusBuilder({
				title: replyLang(locale, 'mine#loot_burned_title'),

				description:
					replyLang(locale, 'mine#loot_burned_desc') +
					'\n\n*🎁 Lootboxes foram mantidas!*',

				color: 0xe74c3c,

				footer: { text: `😵 ${replyLang(locale, 'mine#mining_complete')}` },
			});
		}

		await msg.edit({ embeds: [finalEmbed], components: [] }).catch(() => {});

		await i.reply({
			content: '✅ Ação concluída!',

			flags: ['Ephemeral'],
		});

		lootCollector.stop();
	});

	lootCollector.on('end', () => {
		msg.edit({ components: [] }).catch(() => {});
	});
}
