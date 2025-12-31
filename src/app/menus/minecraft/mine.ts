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

	const userDB = await UserController.get(user.id);

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

	// Variável para controlar se a mineração deve continuar
	let mining = true;

	// Variável para verificar se a picareta quebrou
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

			// Remover botão imediatamente
			await msg.edit({ components: [] }).catch(() => {});

			await i.reply({
				content: replyLang(locale, 'mine#mining_stop'),
				flags: ['Ephemeral'],
			});
		}
	});

	async function saveLoot() {
		// Atualizar picareta com nova durabilidade
		const updatedBackpack = backpack.map((i) =>
			i.type === 'pickaxe' && i.id === pickaxe!.id ? { ...i, durability } : i,
		) as BackpackType;

		// Adicionar loot à mochila
		for (const [ore, qty] of Object.entries(loot)) {
			if (!qty) continue;

			// Verificar se já existe um item desse minério na mochila
			const existingOreIndex = updatedBackpack.findIndex(
				(item) => item.type === 'ore' && item.name === ore,
			);

			if (existingOreIndex !== -1) {
				// Atualizar quantidade existente
				const existingItem = updatedBackpack[existingOreIndex];
				if (existingItem.type === 'ore') {
					updatedBackpack[existingOreIndex] = {
						...existingItem,
						amount: existingItem.amount + qty,
					};
				}
			} else {
				// Adicionar novo item
				updatedBackpack.push({
					id: `${ore}_${randomUUID()}`,
					type: 'ore',
					name: ore as OreType,
					amount: qty,
				});
			}
		}

		await UserController.update(user.id, { backpack: updatedBackpack });
	}

	// Função para processar um ciclo de mineração
	async function processMiningCycle(tick: number): Promise<boolean> {
		await new Promise((res) => setTimeout(res, 1000));

		// Evento aleatório: lava
		if (randomInt(1, 25) === 13) {
			durability = await handleLava(interaction, locale, durability);
		}

		// Garantir que pickaxe não é undefined antes de usar
		if (!pickaxe) {
			mining = false;
			return false;
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

		// Apenas atualizar componentes se ainda estiver minerando
		if (mining && durability > 0) {
			await msg
				.edit({ embeds: [embed], components: [stopRow] })
				.catch(() => {});
		} else {
			await msg.edit({ embeds: [embed], components: [] }).catch(() => {});
		}

		// Verificar se a picareta quebrou
		if (durability <= 0) {
			mining = false;
			pickaxeBroke = true;
			return false; // Parar mineração
		}

		return mining; // Continuar mineração se ainda for true
	}

	// Loop de mineração usando while para poder parar a qualquer momento
	let tick = 0;
	while (tick < 20 && mining) {
		const shouldContinue = await processMiningCycle(tick);
		if (!shouldContinue) break;
		tick++;
	}

	// Parar o collector se ainda estiver ativo
	if (collector && !collector.ended) {
		collector.stop('mining_complete');
	}

	// Salvar o loot imediatamente após parar a mineração
	await saveLoot();

	// Verificar se a mineração foi interrompida por quebra da picareta
	if (pickaxeBroke) {
		const breakEmbed = new EmbedPlusBuilder({
			title: `💥 ${replyLang(locale, 'mine#pickaxe_broken_title')}`,
			description: replyLang(locale, 'mine#pickaxe_broken_desc'),
			color: 0xe74c3c,
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

		await msg.edit({ embeds: [breakEmbed], components: [] }).catch(() => {});
		return; // Terminar aqui se a picareta quebrou
	}

	// Se chegou aqui, a mineração terminou normalmente ou foi interrompida pelo usuário
	const endEmbed = new EmbedPlusBuilder({
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
			// Queimar o loot
			const updatedBackpack = await UserController.getBackpack(user.id);
			// Remover apenas os itens do tipo 'ore' que foram minerados agora
			const filteredBackpack = updatedBackpack.filter((item) => {
				if (item.type === 'ore') {
					return !Object.keys(loot).includes(item.name);
				}
				return true;
			});

			await UserController.update(user.id, { backpack: filteredBackpack });
			loot = {};

			finalEmbed = new EmbedPlusBuilder({
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

	lootCollector.on('end', () => {
		// Se o coletor expirar sem interação, apenas remover os botões
		msg.edit({ components: [] }).catch(() => {});
	});
}
