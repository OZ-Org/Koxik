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
	type Locale,
} from 'discord.js';

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

async function handleLava(
	interaction: ChatInputCommandInteraction,
	locale: Locale,
	durability: number,
): Promise<number> {
	const lavaMsg = await interaction.followUp({
		content: `🌋 ${replyLang(locale, 'mine#lava_appears')}`,
		components: [
			new ActionRowBuilder<ButtonBuilder>().addComponents(
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

	const userDB = await prisma.user.findUnique({
		where: { discord_id: user.id },
	});

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
	let mining = true;

	const embed = new EmbedBuilder({
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

	const stopRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
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
			await i.reply({
				content: replyLang(locale, 'mine#mining_stop'),
				flags: ['Ephemeral'],
			});
			collector.stop('user_stop');
		}
	});

	async function saveLoot() {
		const updatedBackpack = backpack.map((i) =>
			i.type === 'pickaxe' && i.id === pickaxe!.id ? { ...i, durability } : i,
		) as BackpackType;

		for (const [ore, qty] of Object.entries(loot)) {
			if (!qty) continue;
			updatedBackpack.push({
				id: `${ore}_${randomUUID()}`,
				type: 'ore',
				name: ore as OreType,
				amount: qty,
			});
		}

		await prisma.user.update({
			where: { discord_id: user.id },
			data: { backpack: updatedBackpack },
		});
	}

	for (let tick = 0; tick < 20 && mining; tick++) {
		await new Promise((res) => setTimeout(res, 1000));

		// Evento aleatório: lava
		if (randomInt(1, 25) === 13) {
			durability = await handleLava(interaction, locale, durability);
		}

		const ore = generateOre(pickaxe);
		loot[ore] = (loot[ore] ?? 0) + 1;
		durability = Math.max(0, durability - 1);

		const formattedLoot =
			Object.entries(loot)
				.map(([o, q]) => `• ${q}x **${o}**`)
				.join('\n') || replyLang(locale, 'mine#none_yet');

		embed.setFields(
			{
				name: `${replyLang(locale, 'mine#durability_field')} ⚒️`,
				value: progressBar(durability, maxDurability),
			},
			{
				name: `${replyLang(locale, 'mine#loot_field')} 💎`,
				value: formattedLoot,
			},
		);

		embed
			.setColor(0x27ae60)
			.setFooter({ text: replyLang(locale, 'mine#progress_footer') });
		await msg.edit({ embeds: [embed], components: [stopRow] }).catch(() => {});

		if (durability <= 0) {
			mining = false;
			collector.stop('break');
		}
	}

	collector.on('end', async () => {
		await saveLoot();

		const endEmbed = new EmbedBuilder({
			title: `✅ ${replyLang(locale, 'mine#mining_complete')}`,
			description: replyLang(locale, 'mine#choose_loot_action'),
			color: 0x3498db,
			fields: [
				{
					name: replyLang(locale, 'mine#loot_field'),
					value:
						Object.entries(loot)
							.map(([o, q]) => `• ${q}x **${o}**`)
							.join('\n') || replyLang(locale, 'mine#none_yet'),
				},
			],
			footer: {
				text: `⚒️ ${replyLang(locale, 'mine#durability_field')}: ${durability}/${maxDurability}`,
			},
		});

		const lootRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
			new ButtonBuilder()
				.setCustomId('keep')
				.setLabel(replyLang(locale, 'mine#keep_loot'))
				.setStyle(ButtonStyle.Success),
			new ButtonBuilder()
				.setCustomId('burn')
				.setLabel(replyLang(locale, 'mine#burn_loot'))
				.setStyle(ButtonStyle.Danger),
		);

		await msg
			.edit({ embeds: [endEmbed], components: [lootRow] })
			.catch(() => {});

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

			let finalEmbed: EmbedBuilder;

			if (i.customId === 'keep') {
				finalEmbed = new EmbedBuilder({
					title: replyLang(locale, 'mine#loot_saved_title'),
					description: replyLang(locale, 'mine#loot_saved_desc'),
					color: 0x2ecc71,
					footer: { text: `✅ ${replyLang(locale, 'mine#mining_complete')}` },
				});
			} else {
				loot = {};
				finalEmbed = new EmbedBuilder({
					title: replyLang(locale, 'mine#loot_burned_title'),
					description: replyLang(locale, 'mine#loot_burned_desc'),
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
	});
}
