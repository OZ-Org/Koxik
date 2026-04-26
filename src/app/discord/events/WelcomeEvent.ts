import { GuildController } from '@app/jobs/GuildController.js';
import { createEvent } from '@base';
import { logger } from '@fx/utils/logger.js';
import { findChannel } from '@magicyan/discord';
import {
	type Guild,
	type GuildTextBasedChannel,
	Locale,
	PermissionsBitField,
	EmbedBuilder,
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SectionBuilder,
	ButtonBuilder,
	ButtonStyle,
} from 'discord.js';
import { getDefaultMessage } from '../responders/movement/welcome.utils.js';

const processedMembers = new Set();

async function canSendToChannel(
	channelId: string,
	guild: Guild,
): Promise<boolean> {
	const channel = guild.channels.cache.get(channelId) as
		| GuildTextBasedChannel
		| undefined;
	if (!channel) return false;

	const botMember = await guild.members.fetchMe();
	if (!botMember) return false;

	const permissions = channel.permissionsFor(botMember);
	if (!permissions) return false;

	return permissions.has([
		PermissionsBitField.Flags.ViewChannel,
		PermissionsBitField.Flags.SendMessages,
	]);
}

function parseColor(color: string | undefined): number {
	if (!color) return 0x00ff00;
	const hex = color.replace('#', '');
	return parseInt(hex, 16) || 0x00ff00;
}

function parseV2Components(
	components: object[],
	member: {
		id: string;
		user: {
			username: string;
			globalName?: string | null;
			avatarURL?: () => string | null;
		};
	},
	guildName: string,
	memberCount: number,
): unknown[] {
	const typeMap: Record<number, string> = {
		1: 'action_row',
		2: 'button',
		3: 'string_select',
		4: 'text_select',
		5: 'user_select',
		6: 'role_select',
		7: 'mentionable_select',
		8: 'channel_select',
		9: 'input_text',
		10: 'text_display',
		11: 'section',
		12: 'separator',
		13: 'button',
		14: 'text_input',
		17: 'container',
		18: 'section_with_button',
		19: 'separator_with_label',
	};

	function normalizeType(type: string | number): string {
		if (typeof type === 'number') {
			return typeMap[type] || String(type);
		}
		return type;
	}

	return components.map((comp) => {
		if (!('type' in comp)) return comp;
		const c = comp as { type: string | number; [key: string]: unknown };
		const normalizedType = normalizeType(c.type);

		if (normalizedType === 'text_display') {
			const textDisplay = new TextDisplayBuilder();
			let content = String(c.content || '');
			content = GuildController.formatMessage(
				content,
				member,
				guildName,
				memberCount,
			);
			return textDisplay.setContent(content);
		}

		if (normalizedType === 'container') {
			const container = new ContainerBuilder();
			const accentColor = c.accent_color ?? c.accentColor;
			if (accentColor) {
				if (typeof accentColor === 'string') {
					const hex = accentColor.replace('#', '');
					container.setAccentColor(parseInt(hex, 16));
				} else {
					container.setAccentColor(Number(accentColor));
				}
			}
			if (c.label) {
				let label = String(c.label);
				label = GuildController.formatMessage(
					label,
					member,
					guildName,
					memberCount,
				);
				container.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(label),
				);
			}
			if (c.description) {
				let description = String(c.description);
				description = GuildController.formatMessage(
					description,
					member,
					guildName,
					memberCount,
				);
				container.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(description),
				);
			}
			if (c.components && Array.isArray(c.components)) {
				const childComponents = parseV2Components(
					c.components as object[],
					member,
					guildName,
					memberCount,
				);
				childComponents.forEach((child) => {
					if (child instanceof TextDisplayBuilder) {
						container.addTextDisplayComponents(child);
					} else if (child instanceof SectionBuilder) {
						container.addSectionComponents(child);
					}
				});
			}
			return container;
		}

		if (normalizedType === 'section') {
			const section = new SectionBuilder();
			if (c.title) {
				let title = String(c.title);
				title = GuildController.formatMessage(
					title,
					member,
					guildName,
					memberCount,
				);
				section.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(title),
				);
			}
			if (c.text) {
				let text = String(c.text);
				text = GuildController.formatMessage(
					text,
					member,
					guildName,
					memberCount,
				);
				section.addTextDisplayComponents(
					new TextDisplayBuilder().setContent(text),
				);
			}
			if (c.buttonLabel && c.buttonUrl) {
				const button = new ButtonBuilder()
					.setLabel(String(c.buttonLabel))
					.setURL(String(c.buttonUrl))
					.setStyle(ButtonStyle.Link);
				section.setButtonAccessory(button);
			}
			if (c.components && Array.isArray(c.components)) {
				const childComponents = parseV2Components(
					c.components as object[],
					member,
					guildName,
					memberCount,
				);
				childComponents.forEach((child) => {
					if (child instanceof TextDisplayBuilder) {
						section.addTextDisplayComponents(child);
					}
				});
			}
			return section;
		}

		return comp;
	});
}

export default createEvent({
	name: 'welcome',
	event: 'guildMemberAdd',
	run: async (member) => {
		try {
			const key = `${member.guild.id}-${member.id}`;

			if (processedMembers.has(key)) {
				return;
			}

			processedMembers.add(key);

			setTimeout(() => {
				processedMembers.delete(key);
			}, 60000);

			const guildId = member.guild.id;

			const config = await GuildController.getWelcomeConfig(guildId);

			if (!config?.enable) {
				return;
			}

			if (!config.channelId) {
				return;
			}

			const canSend = await canSendToChannel(config.channelId, member.guild);
			if (!canSend) {
				return;
			}

			const channel = findChannel(member.guild).byId(config.channelId);

			if (!channel) {
				return;
			}

			const message =
				config.message || getDefaultMessage(Locale.PortugueseBR, 'welcome');
			const msg = GuildController.formatMessage(
				message,
				member,
				member.guild.name,
				member.guild.memberCount,
			);

			const sendOptions: {
				content?: string;
				embeds?: EmbedBuilder[];
				flags?: MessageFlags;
				components?: unknown[];
			} = {
				content: msg,
			};

			if (config.embed?.enabled) {
				const embed = new EmbedBuilder()
					.setColor(parseColor(config.embed.color))
					.setDescription(msg);

				if (config.embed.title) {
					embed.setTitle(
						GuildController.formatMessage(
							config.embed.title,
							member,
							member.guild.name,
							member.guild.memberCount,
						),
					);
				}

				if (config.embed.thumbnailUrl) {
					embed.setThumbnail(
						GuildController.formatMessage(
							config.embed.thumbnailUrl,
							member,
							member.guild.name,
							member.guild.memberCount,
						),
					);
				}

				if (config.embed.imageUrl) {
					embed.setImage(
						GuildController.formatMessage(
							config.embed.imageUrl,
							member,
							member.guild.name,
							member.guild.memberCount,
						),
					);
				}

				if (config.embed.footer) {
					embed.setFooter({
						text: GuildController.formatMessage(
							config.embed.footer,
							member,
							member.guild.name,
							member.guild.memberCount,
						),
					});
				}

				sendOptions.content = undefined;
				sendOptions.embeds = [embed];
			}

			if (config.components) {
				sendOptions.flags = MessageFlags.IsComponentsV2;
				sendOptions.components = parseV2Components(
					config.components,
					member,
					member.guild.name,
					member.guild.memberCount,
				);
				sendOptions.content = undefined;
				sendOptions.embeds = undefined;
			}

			await channel.send(sendOptions);
		} catch (err) {
			logger.error('Erro no guildMemberAdd:', err);
		}
	},
});
