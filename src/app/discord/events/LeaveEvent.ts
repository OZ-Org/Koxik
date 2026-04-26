import { GuildController } from '@app/jobs/GuildController.js';
import { createEvent } from '@base';
import { logger } from '@fx/utils/logger.js';
import { findChannel } from '@magicyan/discord';
import {
	type Guild,
	type GuildTextBasedChannel,
	PermissionsBitField,
	EmbedBuilder,
	MessageFlags,
	ContainerBuilder,
	TextDisplayBuilder,
	SectionBuilder,
	ButtonBuilder,
	ButtonStyle,
} from 'discord.js';

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
	if (!color) return 0xff0000;
	const hex = color.replace('#', '');
	return parseInt(hex, 16) || 0xff0000;
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
	return components.map((comp) => {
		if (!('type' in comp)) return comp;
		const c = comp as { type: string; [key: string]: unknown };

		if (c.type === 'text_display') {
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

		if (c.type === 'container') {
			const container = new ContainerBuilder();
			if (c.accentColor) {
				const hex = String(c.accentColor).replace('#', '');
				container.setAccentColor(parseInt(hex, 16));
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
			return container;
		}

		if (c.type === 'section') {
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
			return section;
		}

		return comp;
	});
}

export default createEvent({
	name: 'leave',
	event: 'guildMemberRemove',
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

			const config = await GuildController.getLeaveConfig(guildId);

			if (config?.enable && config.channelId) {
				const canSend = await canSendToChannel(config.channelId, member.guild);
				if (!canSend) {
					return;
				}

				const channel = findChannel(member.guild).byId(config.channelId);

				if (channel) {
					const msg = GuildController.formatMessage(
						config.message,
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
					}

					await channel.send(sendOptions);
				}
			}
		} catch (err) {
			logger.error('Erro no guildMemberRemove:', err);
		}
	},
});
