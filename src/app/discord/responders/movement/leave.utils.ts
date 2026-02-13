import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { brBuilder, createRow } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import type { Locale } from 'discord.js';
import {
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	type Guild,
} from 'discord.js';

export type MovementType = 'welcome' | 'leave';

export function getLeaveStatusText(locale: Locale, enabled: boolean): string {
	const onlineEmote = emotes.status.online;
	const offlineEmote = emotes.status.offline;
	const emote = enabled ? onlineEmote : offlineEmote;

	return enabled
		? replyLang(locale, 'welcome#config#leaveEnabled', { emote })
		: replyLang(locale, 'welcome#config#leaveDisabled', { emote });
}

export function getLeaveChannelText(
	locale: Locale,
	channelId: string | null | undefined,
): string {
	if (!channelId) return replyLang(locale, 'welcome#panel#noChannel');
	return replyLang(locale, 'welcome#panel#channel', {
		channel: `<#${channelId}>`,
	});
}

export function getLeaveEmbedColor(enabled: boolean): '#16a34a' | '#7f1d1d' {
	return enabled ? '#16a34a' : '#7f1d1d';
}

export function buildLeavePanelEmbed(
	locale: Locale,
	_guild: Guild,
	enabled: boolean,
	channelId: string | null | undefined,
): EmbedBuilder {
	const status = getLeaveStatusText(locale, enabled);
	const channel = getLeaveChannelText(locale, channelId);
	const color = getLeaveEmbedColor(enabled);

	return new EmbedBuilder()
		.setTitle(replyLang(locale, 'welcome#leave#panel#title'))
		.setDescription(
			brBuilder(
				status,
				channel,
				'',
				replyLang(locale, 'welcome#leave#panel#instruction'),
			),
		)
		.setColor(color);
}

export function buildLeavePanelButtons(
	locale: Locale,
	guildId: string,
	enabled: boolean,
) {
	return createRow(
		new ButtonBuilder()
			.setLabel(
				enabled
					? replyLang(locale, 'welcome#leave#panel#disable')
					: replyLang(locale, 'welcome#leave#panel#enable'),
			)
			.setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success)
			.setCustomId(`gen/leave/toggle/${guildId}`),

		new ButtonBuilder()
			.setLabel(replyLang(locale, 'welcome#leave#panel#setChannel'))
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(`gen/leave/channel/${guildId}`),

		new ButtonBuilder()
			.setLabel(replyLang(locale, 'welcome#leave#panel#editMessage'))
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(`gen/leave/message/${guildId}`),

		new ButtonBuilder()
			.setLabel(replyLang(locale, 'welcome#leave#panel#back'))
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(`gen/back/${guildId}`),
	);
}

export async function updateLeavePanel(
	locale: Locale,
	guildId: string,
	guild: Guild,
	interaction: {
		deferUpdate(options?: { ephemeral?: boolean }): Promise<void>;
		editReply(options: {
			embeds?: EmbedBuilder[];
			components?: ReturnType<typeof createRow>[];
			content?: string;
		}): Promise<unknown>;
	},
	options?: { content?: string },
) {
	const config = await GuildController.getLeaveConfig(guildId);
	const enabled = Boolean(config?.enable);

	const embed = buildLeavePanelEmbed(locale, guild, enabled, config?.channelId);
	const row = buildLeavePanelButtons(locale, guildId, enabled);

	await interaction.deferUpdate();

	return interaction.editReply({
		embeds: [embed],
		components: [row],
		content: options?.content,
	});
}

export function getDefaultLeaveMessage(locale: Locale): string {
	return replyLang(locale, 'welcome#message#defaultLeave');
}
