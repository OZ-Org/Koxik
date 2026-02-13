import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createResponder, registerResponder } from '@base';
import {
	buildWelcomePanelButtons,
	buildWelcomePanelEmbed,
} from './welcome.utils.js';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/welcome/{guildId}',
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

			const config = await GuildController.getWelcomeConfig(guildId);
			const enabled = Boolean(config?.enable);

			const embed = buildWelcomePanelEmbed(
				interaction.locale,
				interaction.guild,
				enabled,
				config?.channelId,
			);
			const row = buildWelcomePanelButtons(
				interaction.locale,
				guildId,
				enabled,
			);

			return res.update().raw({
				embeds: [embed],
				components: [row],
			});
		},
	}),
);
