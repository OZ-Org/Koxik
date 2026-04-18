import { randomInt, randomUUID } from 'node:crypto';
import { replyLang } from '@fx/utils/replyLang.js';
import { createRow, EmbedPlusBuilder } from '@magicyan/discord';
import type {
	BackpackItem,
	BackpackType,
	OreType,
	PickaxesTypesIDs,
} from 'app/shared/types.js';
import {
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	ComponentType,
	type Locale,
} from 'discord.js';
import { UserController } from '../../jobs/UserController.js';
import { emotes } from '@misc/emotes.js';

type LootboxRarity = 'common' | 'rare' | 'epic';

interface LootboxDrop {
	id: string;
	type: 'lootbox';
	rarity: LootboxRarity;
}

const PICKAXE_RATES: Record<
	PickaxesTypesIDs,
	Partial<Record<OreType, number>>
> = {
	PICX_WOODEN: { stone: 70, coal: 30 },
	PICX_STONE: { stone: 60, coal: 30, iron: 10 },
	PICX_GOLD: { stone: 30, coal: 20 },
	PICX_IRON: { stone: 30, coal: 25, iron: 30, gold: 10, diamond: 5 },
	PICX_DIAMOND: { stone: 35, coal: 20, iron: 25, gold: 20, diamond: 5 },
	PICX_NETHERITE: { stone: 10, coal: 25, iron: 25, gold: 45, diamond: 5 },
};

function rollOre(pickaxeId: PickaxesTypesIDs): OreType {
	const rates = PICKAXE_RATES[pickaxeId];

	if (!rates) return 'stone';

	const roll = randomInt(1, 101);
	let acc = 0;

	for (const [ore, chance] of Object.entries(rates)) {
		acc += chance;
		if (roll <= acc) return ore as OreType;
	}

	return 'stone';
}

function getOreEmoji(ore: OreType) {
	const map: Partial<Record<OreType, string>> = {
		diamond: emotes.minecraft.ores.diamond,
		iron: emotes.minecraft.ores.iron,
		gold: emotes.minecraft.ores.gold,
		coal: emotes.minecraft.ores.coal,
	};
	return map[ore] ?? '🪨';
}

function getPickaxeEmoji(id: PickaxesTypesIDs) {
	const map = {
		PICX_WOODEN: emotes.minecraft.pickaxe.wooden_pickaxe,
		PICX_STONE: emotes.minecraft.pickaxe.stone_pickaxe,
		PICX_IRON: emotes.minecraft.pickaxe.iron_pickaxe,
		PICX_GOLD: emotes.minecraft.pickaxe.golden_pickaxe,
		PICX_DIAMOND: emotes.minecraft.pickaxe.diamond_pickaxe,
		PICX_NETHERITE: emotes.minecraft.pickaxe.netherite_pickaxe,
	} as const;

	return map[id] ?? '⛏️';
}

function progressBar(current: number, max: number, size = 12) {
	const filled = Math.round((current / max) * size);
	return `[${'🟩'.repeat(filled)}${'⬛'.repeat(size - filled)}] ${current}/${max}`;
}

function checkLootbox(): LootboxDrop | null {
	const roll = randomInt(1, 101);

	if (roll <= 2) return { id: randomUUID(), type: 'lootbox', rarity: 'common' };
	if (roll <= 3) return { id: randomUUID(), type: 'lootbox', rarity: 'rare' };
	if (roll === 4) return { id: randomUUID(), type: 'lootbox', rarity: 'epic' };

	return null;
}

async function handleLava(
	interaction: ChatInputCommandInteraction,
	locale: Locale,
	durability: number,
) {
	const msg = await interaction.followUp({
		content: `🌋 ${replyLang(locale, 'mine#lava_appears')}`,
		components: [
			createRow(
				new ButtonBuilder()
					.setCustomId('jump')
					.setLabel('🔥 PULAR')
					.setStyle(ButtonStyle.Danger),
			),
		],
		flags: ['Ephemeral'],
	});

	let jumped = false;

	const collector = msg.createMessageComponentCollector({
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
		}
	});

	return new Promise<number>((resolve) => {
		collector.on('end', async () => {
			if (!jumped) {
				durability = Math.max(0, durability - 2);
				await interaction.followUp({
					content: replyLang(locale, 'mine#lava_jump_fail'),
					flags: ['Ephemeral'],
				});
			}
			resolve(durability);
		});
	});
}

export async function mine(interaction: ChatInputCommandInteraction) {
	const user = interaction.user;
	const pickaxeId = interaction.options.getString(
		'pickaxe',
		true,
	) as PickaxesTypesIDs;

	const locale = interaction.locale ?? 'pt-BR';

	const userDB = await UserController.find(user.id);
	if (!userDB || !userDB.backpack) return;

	const backpack = userDB.backpack as BackpackType;

	const pickaxe = backpack.find(
		(i) => i.type === 'pickaxe' && i.id === pickaxeId,
	) as Extract<BackpackItem, { type: 'pickaxe' }> | undefined;

	if (!pickaxe || pickaxe.durability <= 0) return;

	let durability = pickaxe.durability;
	const maxDurability = pickaxe.durability;

	const loot: Partial<Record<OreType, number>> = {};
	const lootboxes: LootboxDrop[] = [];

	let mining = true;

	const embed = new EmbedPlusBuilder({
		title: `${getPickaxeEmoji(pickaxeId)} Mineração`,
		color: 0x2ecc71,
		fields: [
			{ name: 'Durabilidade', value: progressBar(durability, maxDurability) },
			{ name: 'Loot', value: 'Nada ainda...' },
		],
	});

	const stopRow = createRow(
		new ButtonBuilder()
			.setCustomId('stop')
			.setLabel('Parar')
			.setStyle(ButtonStyle.Danger),
	);

	await interaction.reply({ embeds: [embed], components: [stopRow] });

	const msg = await interaction.fetchReply();

	const collector = msg.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 60000,
	});

	collector.on('collect', async (i) => {
		if (i.user.id !== user.id) return;

		if (i.customId === 'stop') {
			mining = false;
			collector.stop();
			await msg.edit({ components: [] });
			await i.reply({ content: 'Parado.', flags: ['Ephemeral'] });
		}
	});

	let tick = 0;

	while (mining && durability > 0 && tick < 25) {
		await new Promise((r) => setTimeout(r, 1000));

		if (!mining) break;

		if (randomInt(1, 25) === 13) {
			durability = await handleLava(interaction, locale, durability);
		}

		const ore = rollOre(pickaxeId);
		loot[ore] = (loot[ore] ?? 0) + 1;

		const box = checkLootbox();
		if (box) lootboxes.push(box);

		durability--;

		embed.setFields(
			{
				name: 'Durabilidade',
				value: progressBar(durability, maxDurability),
			},
			{
				name: 'Loot',
				value:
					Object.entries(loot)
						.map(([o, q]) => `• ${q}x ${getOreEmoji(o as OreType)} ${o}`)
						.join('\n') || 'Nada...',
			},
		);

		await msg.edit({ embeds: [embed], components: [stopRow] });

		tick++;
	}

	await msg.edit({ components: [] });

	const actionRow = createRow(
		new ButtonBuilder()
			.setCustomId('keep')
			.setLabel('Guardar')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId('burn')
			.setLabel('Jogar fora')
			.setStyle(ButtonStyle.Danger),
	);

	await msg.edit({
		embeds: [embed.setTitle('Finalizado')],
		components: [actionRow],
	});

	const endCollector = msg.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 20000,
	});

	endCollector.on('collect', async (i) => {
		if (i.user.id !== user.id) return;

		if (i.customId === 'keep') {
			const updated = [...backpack];

			for (const [ore, qty] of Object.entries(loot)) {
				const id = `ore_${ore}`;

				const found = updated.find((i) => i.type === 'ore' && i.id === id);

				if (found && found.type === 'ore') {
					found.amount += qty!;
				} else {
					updated.push({
						id,
						type: 'ore',
						name: ore as OreType,
						amount: qty!,
					});
				}
			}

			await UserController.update(user.id, {
				backpack: updated.map((i) =>
					i.type === 'pickaxe' && i.id === pickaxeId ? { ...i, durability } : i,
				),
			});

			await i.reply({ content: 'Salvo.', flags: ['Ephemeral'] });
		} else {
			await UserController.update(user.id, {
				backpack: backpack.map((i) =>
					i.type === 'pickaxe' && i.id === pickaxeId ? { ...i, durability } : i,
				),
			});

			await i.reply({ content: 'Loot descartado.', flags: ['Ephemeral'] });
		}

		endCollector.stop();
		await msg.edit({ components: [] });
	});
}
