import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createResponder, registerResponder } from '@base';
import { createLabel } from '@magicyan/discord';
import { ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { getDefaultLeaveMessage } from './leave.utils.js';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/leave/message/{guildId}',
		run: async ({ interaction, useParams }) => {
			const { guildId } = useParams();

			const config = await GuildController.getLeaveConfig(guildId);

			const modal = new ModalBuilder()
				.setCustomId(`gen/leave/message/modal/${guildId}`)
				.setTitle(replyLang(interaction.locale, 'welcome#leave#message#title'));

			const input = new TextInputBuilder()
				.setCustomId('message')
				.setStyle(TextInputStyle.Paragraph)
				.setRequired(true)
				.setValue(
					config?.message || getDefaultLeaveMessage(interaction.locale),
				);

			const label = createLabel({
				label: replyLang(interaction.locale, 'welcome#leave#message#label'),
				component: input,
			});

			modal.addLabelComponents(label);

			await interaction.showModal(modal);
		},
	}),
);

registerResponder(
	createResponder({
		type: 'modal',
		customId: 'gen/leave/message/modal/{guildId}',
		run: async ({ interaction, res, useParams }) => {
			const { guildId } = useParams();

			const message = interaction.fields.getTextInputValue('message');

			const result = await GuildController.setMovementLog(guildId, 'leave', {
				message,
			});

			if (!result) {
				return res
					.ephemeral()
					.crying(
						replyLang(interaction.locale, 'welcome#errors#saveMessage'),
						interaction.locale,
					);
			}

			return res
				.ephemeral()
				.success(
					replyLang(interaction.locale, 'welcome#leave#message#success'),
				);
		},
	}),
);
