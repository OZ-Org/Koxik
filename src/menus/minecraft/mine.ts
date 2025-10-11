import { randomInt, randomUUID } from 'node:crypto';
import { prisma } from '@db';
import { replyLang } from '@fx/utils/replyLang.js';
import type { BackpackItem, BackpackType, OreType } from '@misc/types.js';
import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	type ChatInputCommandInteraction,
	ComponentType,
	EmbedBuilder,
} from 'discord.js';

function progressBar(current: number, max: number, size = 10) {
	const filled = Math.round((current / max) * size);
	const empty = size - filled;
	return '🟩'.repeat(filled) + '🟥'.repeat(empty);
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

export async function mine(interaction: ChatInputCommandInteraction) {
	const user = interaction.user;
	const pickaxeId = interaction.options.getString('pickaxe', true);

	const userDB = await prisma.user.findUnique({
		where: { discord_id: user.id },
	});
	if (!userDB?.backpack)
		return interaction.reply({
			content: replyLang(interaction.locale, 'mine#no_backpack'),
			ephemeral: true,
		});

	const backpack = userDB.backpack as BackpackType;
	const pickaxe = backpack.find(
		(i) => i.type === 'pickaxe' && i.id === pickaxeId,
	) as Extract<BackpackItem, { type: 'pickaxe' }> | undefined;

	if (!pickaxe)
		return interaction.reply({
			content: replyLang(interaction.locale, 'mine#pickaxe_not_found'),
			ephemeral: true,
		});

	if (pickaxe.durability <= 0)
		return interaction.reply({
			content: replyLang(interaction.locale, 'mine#pickaxe_broken'),
			ephemeral: true,
		});

	let durability = pickaxe.durability;
	const maxDurability = pickaxe.durability;
	let loot: Partial<Record<OreType, number>> = {};
	let mining = true;

	// Embed inicial
	const embed = new EmbedBuilder()
		.setTitle(replyLang(interaction.locale, 'mine#mining_start'))
		.setColor(0x2ecc71)
		.addFields(
			{
				name: replyLang(interaction.locale, 'mine#durability_field'),
				value: progressBar(durability, maxDurability),
				inline: false,
			},
			{
				name: replyLang(interaction.locale, 'mine#loot_field'),
				value: replyLang(interaction.locale, 'mine#none_yet'),
				inline: false,
			},
		);

	const stopRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
		new ButtonBuilder()
			.setCustomId('stop')
			.setLabel(replyLang(interaction.locale, 'mine#stop_button'))
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
				content: replyLang(interaction.locale, 'mine#not_your_button'),
				ephemeral: true,
			});

		if (i.customId === 'stop') {
			mining = false;
			collector.stop('user_stop');
		}

		if (i.customId === 'jump') {
			await i.reply(replyLang(interaction.locale, 'mine#lava_jump_success'));
		}

		if (i.customId === 'keep') {
			await saveLoot();
			await i.reply(replyLang(interaction.locale, 'mine#keep_loot'));
			collector.stop('done');
		}

		if (i.customId === 'burn') {
			loot = {};
			await i.reply(replyLang(interaction.locale, 'mine#burn_loot'));
			collector.stop('done');
		}
	});

	async function saveLoot() {
		if (Object.keys(loot).length === 0) return;

		const updatedBackpack = [...backpack];
		for (const [ore, qty] of Object.entries(loot)) {
			updatedBackpack.push({
				id: `${ore}_${randomUUID()}`,
				type: 'ore',
				name: ore as OreType,
				amount: qty!,
			});
		}

		await prisma.user.update({
			where: { discord_id: user.id },
			data: {
				backpack: updatedBackpack.map((i) =>
					// @ts-expect-error
					i.type === 'pickaxe' && i.id === pickaxe.id
						? { ...i, durability }
						: i,
				) as any,
			},
		});
	}

	for (let tick = 0; tick < 20 && mining; tick++) {
		await new Promise((res) => setTimeout(res, 1000));

		// Chance lava
		let lavaActive = false;
		if (randomInt(1, 25) === 13) {
			lavaActive = true;
			const lavaRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
				new ButtonBuilder()
					.setCustomId('jump')
					.setLabel(replyLang(interaction.locale, 'mine#lava_appears'))
					.setStyle(ButtonStyle.Danger),
			);
			await interaction.followUp({
				content: replyLang(interaction.locale, 'mine#lava_appears'),
				components: [lavaRow],
			});
		}

		// Minerar
		const ore = generateOre(pickaxe);
		loot[ore] = (loot[ore] ?? 0) + 1;
		durability--;

		// Atualizar embed
		const formattedLoot =
			Object.entries(loot)
				.map(([o, q]) => `${q}x ${o}`)
				.join('\n') || replyLang(interaction.locale, 'mine#none_yet');

		embed
			.setDescription(
				lavaActive
					? replyLang(interaction.locale, 'mine#lava_appears')
					: replyLang(interaction.locale, 'mine#mining_progress'),
			)
			.setColor(lavaActive ? 0xe74c3c : 0x2ecc71)
			.spliceFields(
				0,
				2,
				{
					name: replyLang(interaction.locale, 'mine#durability_field'),
					value: progressBar(durability, maxDurability),
					inline: false,
				},
				{
					name: replyLang(interaction.locale, 'mine#loot_field'),
					value: formattedLoot,
					inline: false,
				},
			);

		await msg.edit({ embeds: [embed], components: [stopRow] }).catch(() => {});

		if (durability <= 0) {
			mining = false;
			collector.stop('break');
		}
	}

	collector.on('end', async (_, __) => {
		// Fim da mineração, mostrar botões de guardar ou queimar
		embed
			.setTitle(replyLang(interaction.locale, 'mine#mining_complete'))
			.setDescription(replyLang(interaction.locale, 'mine#choose_loot_action'))
			.setColor(0x3498db);

		const lootRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('keep')
				.setLabel(replyLang(interaction.locale, 'mine#keep_loot'))
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('burn')
				.setLabel(replyLang(interaction.locale, 'mine#burn_loot'))
				.setStyle(ButtonStyle.Danger),
		);

		await msg
			.edit({
				embeds: [embed],
				components: lootRow.components.length ? [lootRow] : [],
			})
			.catch(() => {});
	});
}
