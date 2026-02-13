import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createResponder, registerResponder } from '@base';
import { brBuilder, createRow } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import { ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/back/{guildId}',
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

			const welcomeEnabled = await GuildController.isWelcomeEnabled(guildId);
			const leaveEnabled = await GuildController.isLeaveEnabled(guildId);

			const onlineEmote = emotes.status.online;
			const offlineEmote = emotes.status.offline;

			const welStr = welcomeEnabled
				? replyLang(interaction.locale, 'welcome#config#welcomeEnabled', {
						emote: onlineEmote,
					})
				: replyLang(interaction.locale, 'welcome#config#welcomeDisabled', {
						emote: offlineEmote,
					});

			const leaStr = leaveEnabled
				? replyLang(interaction.locale, 'welcome#config#leaveEnabled', {
						emote: onlineEmote,
					})
				: replyLang(interaction.locale, 'welcome#config#leaveDisabled', {
						emote: offlineEmote,
					});

			const embed = new EmbedBuilder()
				.setTitle(replyLang(interaction.locale, 'welcome#config#title'))
				.setDescription(brBuilder(welStr, leaStr))
				.setColor('#0c0a09');

			const row = createRow(
				new ButtonBuilder()
					.setLabel(
						replyLang(interaction.locale, 'welcome#config#welcomeButton'),
					)
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`gen/welcome/${guildId}`),
				new ButtonBuilder()
					.setLabel(replyLang(interaction.locale, 'welcome#config#leaveButton'))
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`gen/leave/${guildId}`),
			);

			return res.update().raw({
				embeds: [embed],
				components: [row],
			});
		},
	}),
);
