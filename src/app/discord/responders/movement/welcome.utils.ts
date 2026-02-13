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

export function getStatusText(
	locale: Locale,
	type: MovementType,
	enabled: boolean,
): string {
	const onlineEmote = emotes.status.online;
	const offlineEmote = emotes.status.offline;
	const emote = enabled ? onlineEmote : offlineEmote;

	if (type === 'welcome') {
		return enabled
			? replyLang(locale, 'welcome#config#welcomeEnabled', { emote })
			: replyLang(locale, 'welcome#config#welcomeDisabled', { emote });
	}
	return enabled
		? replyLang(locale, 'welcome#config#leaveEnabled', { emote })
		: replyLang(locale, 'welcome#config#leaveDisabled', { emote });
}

export function getChannelText(
	locale: Locale,
	channelId: string | null | undefined,
): string {
	if (!channelId)
		return `${emotes.ui.channel} | ${replyLang(locale, 'welcome#panel#noChannel')}`;
	return `${emotes.ui.channel} | ${replyLang(locale, 'welcome#panel#channel', {
		channel: `<#${channelId}>`,
	})}`;
}

export function getEmbedColor(enabled: boolean): '#16a34a' | '#7f1d1d' {
	return enabled ? '#16a34a' : '#7f1d1d';
}

export function buildWelcomePanelEmbed(
	locale: Locale,
	_guild: Guild,
	enabled: boolean,
	channelId: string | null | undefined,
): EmbedBuilder {
	const status = getStatusText(locale, 'welcome', enabled);
	const channel = getChannelText(locale, channelId);
	const color = getEmbedColor(enabled);

	return new EmbedBuilder()
		.setTitle(replyLang(locale, 'welcome#panel#title'))
		.setDescription(
			brBuilder(
				status,
				channel,
				'',
				replyLang(locale, 'welcome#panel#instruction'),
			),
		)
		.setColor(color);
}

export function buildWelcomePanelButtons(
	locale: Locale,
	guildId: string,
	enabled: boolean,
) {
	return createRow(
		new ButtonBuilder()
			.setLabel(
				enabled
					? replyLang(locale, 'welcome#panel#disable')
					: replyLang(locale, 'welcome#panel#enable'),
			)
			.setStyle(enabled ? ButtonStyle.Danger : ButtonStyle.Success)
			.setCustomId(`gen/welcome/toggle/${guildId}`),

		new ButtonBuilder()
			.setLabel(replyLang(locale, 'welcome#panel#setChannel'))
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(`gen/welcome/channel/${guildId}`),

		new ButtonBuilder()
			.setLabel(replyLang(locale, 'welcome#panel#editMessage'))
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(`gen/welcome/message/${guildId}`),

		new ButtonBuilder()
			.setLabel(replyLang(locale, 'welcome#panel#back'))
			.setStyle(ButtonStyle.Secondary)
			.setCustomId(`gen/back/${guildId}`),
	);
}

export async function updateWelcomePanel(
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
) {
	const config = await GuildController.getWelcomeConfig(guildId);
	const enabled = Boolean(config?.enable);

	const embed = buildWelcomePanelEmbed(
		locale,
		guild,
		enabled,
		config?.channelId,
	);
	const row = buildWelcomePanelButtons(locale, guildId, enabled);

	await interaction.deferUpdate();

	return interaction.editReply({
		embeds: [embed],
		components: [row],
		content: '',
	});
}

export function getDefaultMessage(locale: Locale, type: MovementType): string {
	if (type === 'welcome') {
		return replyLang(locale, 'welcome#message#defaultWelcome');
	}
	return replyLang(locale, 'welcome#message#defaultLeave');
}
