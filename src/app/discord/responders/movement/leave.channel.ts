import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createResponder, registerResponder } from '@base';
import { createRow } from '@magicyan/discord';
import {
	ChannelSelectMenuBuilder,
	ChannelType,
	type Guild,
	type GuildTextBasedChannel,
	PermissionsBitField,
} from 'discord.js';
import { updateLeavePanel } from './leave.utils.js';

async function checkChannelPermissions(
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

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/leave/channel/{guildId}',
		run: async ({ interaction, res, useParams }) => {
			const { guildId } = useParams();

			if (!interaction.guild) {
				return res
					.ephemeral()
					.crying(
						replyLang(interaction.locale, 'welcome#errors#invalidGuild'),
						interaction.locale,
					);
			}

			const row = createRow(
				new ChannelSelectMenuBuilder()
					.setCustomId(`gen/leave/channel/select/${guildId}`)
					.setPlaceholder(
						replyLang(interaction.locale, 'welcome#leave#channel#placeholder'),
					)
					.addChannelTypes(ChannelType.GuildText),
			);

			try {
				await interaction.deferUpdate();
				return interaction.editReply({
					content: replyLang(
						interaction.locale,
						'welcome#leave#channel#content',
					),
					components: [row],
				});
			} catch (error) {
				console.error('Error updating interaction:', error);
				return res
					.ephemeral()
					.crying(
						replyLang(interaction.locale, 'welcome#errors#updatePanel'),
						interaction.locale,
					);
			}
		},
	}),
);

registerResponder(
	createResponder({
		type: 'channelSelect',
		customId: 'gen/leave/channel/select/{guildId}',
		run: async ({ interaction, res, useParams }) => {
			const { guildId } = useParams();
			const channelId = interaction.values[0];

			if (interaction.guild) {
				const hasPermission = await checkChannelPermissions(
					channelId,
					interaction.guild,
				);
				if (!hasPermission) {
					return res
						.ephemeral()
						.crying(
							replyLang(interaction.locale, 'welcome#errors#noPermission'),
							interaction.locale,
						);
				}
			}

			const result = await GuildController.setMovementLog(guildId, 'leave', {
				channelId,
			});

			if (!result) {
				return res
					.ephemeral()
					.crying(
						replyLang(interaction.locale, 'welcome#errors#saveChannel'),
						interaction.locale,
					);
			}

			try {
				if (interaction.guild) {
					await updateLeavePanel(
						interaction.locale,
						guildId,
						interaction.guild,
						interaction as any,
					);
				}
			} catch (error) {
				console.error('Error updating interaction:', error);
				return res
					.ephemeral()
					.crying(
						replyLang(interaction.locale, 'welcome#errors#updatePanel'),
						interaction.locale,
					);
			}
		},
	}),
);
