import { UserController } from '@app/jobs/UserController.js';
import { createCommand } from '@base';
import { EmbedBuilder } from 'discord.js';
import { emotes } from '@misc/emotes.js';
import { BackpackType } from '@app/shared/types.js';
import { replyLang } from '@fx/utils/replyLang.js';

function getPickaxeData(id: string) {
	const map = {
		PICX_WOODEN: {
			name: 'Wooden Pickaxe',
			emoji: emotes.minecraft.pickaxe.wooden_pickaxe,
		},
		PICX_STONE: {
			name: 'Stone Pickaxe',
			emoji: emotes.minecraft.pickaxe.stone_pickaxe,
		},
		PICX_IRON: {
			name: 'Iron Pickaxe',
			emoji: emotes.minecraft.pickaxe.iron_pickaxe,
		},
		PICX_DIAMOND: {
			name: 'Diamond Pickaxe',
			emoji: emotes.minecraft.pickaxe.diamond_pickaxe,
		},
		PICX_NETHERITE: {
			name: 'Netherite Pickaxe',
			emoji: emotes.minecraft.pickaxe.netherite_pickaxe,
		},
	} as const;

	return (
		map[id as keyof typeof map] ?? {
			name: id,
			emoji: '⛏️',
		}
	);
}

export default createCommand({
	name: 'backpack',
	description: 'Veja sua mochila',
	run: async ({ res, interaction }) => {
		const user = await UserController.get(interaction.user.id);
		const backpack = (user?.backpack ?? []) as BackpackType;

		if (!backpack.length) {
			return res.ephemeral().raw({
				embeds: [
					new EmbedBuilder({
						title: replyLang(
							interaction.locale,
							'commands#backpack#empty#title',
						),
						description: replyLang(
							interaction.locale,
							'commands#backpack#empty#description',
						),
					}),
				],
			});
		}

		const ores: string[] = [];
		const pickaxes: string[] = [];
		const others: string[] = [];

		for (const item of backpack) {
			if (item.type === 'ore') {
				const emoji =
					emotes.minecraft.ores[
						item.name as keyof typeof emotes.minecraft.ores
					] ?? '🪨';

				ores.push(`• ${emoji} ${item.name} x${item.amount}`);
			} else if (item.type === 'pickaxe') {
				const data = getPickaxeData(item.maked);

				pickaxes.push(
					`• ${data.emoji} ${data.name} (${item.durability} durabilidade)`,
				);
			} else {
				others.push(`• ${item.name ?? item.id}`);
			}
		}

		const embed = new EmbedBuilder()
			.setTitle(replyLang(interaction.locale, 'commands#backpack#title'))
			.setColor(0x5865f2)
			.setFooter({
				text: `${interaction.user.username}`,
				iconURL: interaction.user.displayAvatarURL(),
			});

		if (pickaxes.length) {
			embed.addFields({
				name: replyLang(
					interaction.locale,
					'commands#backpack#fields#pickaxes',
				),
				value: pickaxes.join('\n'),
			});
		}

		if (ores.length) {
			embed.addFields({
				name: replyLang(interaction.locale, 'commands#backpack#fields#ores'),
				value: ores.join('\n'),
			});
		}

		if (others.length) {
			embed.addFields({
				name: replyLang(interaction.locale, 'commands#backpack#fields#others'),
				value: others.join('\n'),
			});
		}

		return res.ephemeral().raw({
			embeds: [embed],
		});
	},
});
