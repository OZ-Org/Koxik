import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { createResponder, registerResponder } from '@base';
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/leave/embed/{guildId}',
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
			const embedConfig = config?.embed ?? { enabled: false };

			const { buildLeavePanelEmbed } = await import('./leave.utils.js');

			const embed = buildLeavePanelEmbed(
				interaction.locale,
				interaction.guild,
				embedConfig.enabled,
				config?.channelId,
			);

			const { buildLeavePanelButtons } = await import('./leave.utils.js');

			const row = buildLeavePanelButtons(
				interaction.locale,
				guildId,
				embedConfig.enabled,
			);

			return res.update().raw({
				embeds: [embed],
				components: [row],
			});
		},
	}),
);

function buildEmbedModal(
	customId: string,
	title: string,
	label: string,
	placeholder: string,
	previousValue?: string,
) {
	const input = new TextInputBuilder()
		.setCustomId('value')
		.setLabel(label)
		.setStyle(TextInputStyle.Short)
		.setPlaceholder(placeholder)
		.setValue(previousValue ?? '')
		.setRequired(false);

	const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);

	return new ModalBuilder()
		.setCustomId(customId)
		.setTitle(title)
		.addComponents(row);
}

function parseEmbedField(value: string | undefined): string | undefined {
	if (!value || value.trim() === '') return undefined;
	return value.trim();
}

function buildLeaveEmbedModalHandler(
	type: 'title' | 'color' | 'footer' | 'imageUrl' | 'thumbnailUrl',
) {
	const config = {
		title: {
			modal: 'leave-embed-title',
			panel: 'gen/leave/embed/title/{guildId}',
			langTitle: 'welcome#embed#editTitle',
			langLabel: 'welcome#embed#titleLabel',
			langPlaceholder: 'welcome#embed#titlePlaceholder',
			langSuccess: 'welcome#embed#titleSaved',
			langField: 'title',
		},
		color: {
			modal: 'leave-embed-color',
			panel: 'gen/leave/embed/color/{guildId}',
			langTitle: 'welcome#embed#editColor',
			langLabel: 'welcome#embed#colorLabel',
			langPlaceholder: 'welcome#embed#colorPlaceholder',
			langSuccess: 'welcome#embed#colorSaved',
			langField: 'color',
		},
		footer: {
			modal: 'leave-embed-footer',
			panel: 'gen/leave/embed/footer/{guildId}',
			langTitle: 'welcome#embed#editFooter',
			langLabel: 'welcome#embed#footerLabel',
			langPlaceholder: 'welcome#embed#footerPlaceholder',
			langSuccess: 'welcome#embed#footerSaved',
			langField: 'footer',
		},
		imageUrl: {
			modal: 'leave-embed-image',
			panel: 'gen/leave/embed/image/{guildId}',
			langTitle: 'welcome#embed#editImage',
			langLabel: 'welcome#embed#imageLabel',
			langPlaceholder: 'welcome#embed#imagePlaceholder',
			langSuccess: 'welcome#embed#imageSaved',
			langField: 'imageUrl',
		},
		thumbnailUrl: {
			modal: 'leave-embed-thumbnail',
			panel: 'gen/leave/embed/thumbnail/{guildId}',
			langTitle: 'welcome#embed#editThumbnail',
			langLabel: 'welcome#embed#thumbnailLabel',
			langPlaceholder: 'welcome#embed#thumbnailPlaceholder',
			langSuccess: 'welcome#embed#thumbnailSaved',
			langField: 'thumbnailUrl',
		},
	} as const;

	const cfg = config[type];

	registerResponder(
		createResponder({
			type: 'button',
			customId: cfg.panel,
			run: async ({ interaction, useParams }) => {
				const { guildId } = useParams();

				if (!interaction.guild) return;

				const currentConfig = await GuildController.getLeaveConfig(guildId);
				const previousValue = currentConfig?.embed?.[
					cfg.langField as keyof typeof currentConfig.embed
				] as string | undefined;

				const modal = buildEmbedModal(
					`${cfg.modal}/${guildId}`,
					replyLang(interaction.locale, cfg.langTitle),
					replyLang(interaction.locale, cfg.langLabel),
					replyLang(interaction.locale, cfg.langPlaceholder),
					previousValue,
				);

				return interaction.showModal(modal);
			},
		}),
	);

	registerResponder(
		createResponder({
			type: 'modal',
			customId: `${cfg.modal}/{guildId}`,
			run: async ({ interaction, res, useParams }) => {
				const { guildId } = useParams();
				const value = interaction.fields.getTextInputValue('value');

				if (!interaction.guild) return;

				await res.ephemeral().defer();

				const currentConfig = await GuildController.getLeaveConfig(guildId);
				const embedConfig = currentConfig?.embed ?? { enabled: false };

				await GuildController.setMovementLog(guildId, 'leave', {
					embed: {
						...embedConfig,
						[cfg.langField]: parseEmbedField(value),
					},
				});

				return res.success(replyLang(interaction.locale, cfg.langSuccess));
			},
		}),
	);
}

buildLeaveEmbedModalHandler('title');
buildLeaveEmbedModalHandler('color');
buildLeaveEmbedModalHandler('footer');
buildLeaveEmbedModalHandler('imageUrl');
buildLeaveEmbedModalHandler('thumbnailUrl');
