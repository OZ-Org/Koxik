import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createResponder, registerResponder } from '@base';
import { updateLeavePanel } from './leave.utils.js';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/leave/toggle/{guildId}',
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

			const current = await GuildController.isLeaveEnabled(guildId);
			const result = await GuildController.toggleMovementLog(
				guildId,
				'leave',
				!current,
			);

			if (!result) {
				return res
					.ephemeral()
					.crying(
						replyLang(interaction.locale, 'welcome#errors#toggle'),
						interaction.locale,
					);
			}

			try {
				await updateLeavePanel(
					interaction.locale,
					guildId,
					interaction.guild,
					interaction as any,
				);
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
