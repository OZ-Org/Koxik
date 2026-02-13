import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createSubCommand } from '@base';
import { brBuilder, createRow } from '@magicyan/discord';
import { emotes } from '@misc/emotes.js';
import {
	ButtonBuilder,
	ButtonStyle,
	EmbedBuilder,
	PermissionsBitField,
} from 'discord.js';

export default createSubCommand({
	name: 'welcome',
	name_localizations: {
		'pt-BR': 'bemvindx',
		'es-ES': 'bienvenido',
	},
	description: 'Configure welcome and leave system',
	description_localizations: {
		'pt-BR': 'Configure o sistema de bem-vindos e saídas.',
		'es-ES': 'Configurar sistema de bienvenida y salida.',
	},
	cooldown: 5,
	default_member_permissions: [PermissionsBitField.Flags.ManageGuild],

	run: async ({ interaction, res }) => {
		if (!interaction.guild) {
			return res.ephemeral().crying('No guild', interaction.locale);
		}

		await res.ephemeral().defer();

		const welcomeEnabled = await GuildController.isWelcomeEnabled(
			interaction.guild.id,
		);
		const leaveEnabled = await GuildController.isLeaveEnabled(
			interaction.guild.id,
		);

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
				.setLabel(replyLang(interaction.locale, 'welcome#config#welcomeButton'))
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(`gen/welcome/${interaction.guild.id}`),
			new ButtonBuilder()
				.setLabel(replyLang(interaction.locale, 'welcome#config#leaveButton'))
				.setStyle(ButtonStyle.Secondary)
				.setCustomId(`gen/leave/${interaction.guild.id}`),
		);

		return res.update().raw({
			embeds: [embed],
			components: [row],
		});
	},
});
