import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createResponder, registerResponder } from '@base';
import { buildLeavePanelButtons, buildLeavePanelEmbed } from './leave.utils.js';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/leave/{guildId}',
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

			const config = await GuildController.getLeaveConfig(guildId);
			const enabled = Boolean(config?.enable);

			const embed = buildLeavePanelEmbed(
				interaction.locale,
				interaction.guild,
				enabled,
				config?.channelId,
			);
			const row = buildLeavePanelButtons(interaction.locale, guildId, enabled);

			return res.update().raw({
				embeds: [embed],
				components: [row],
			});
		},
	}),
);
