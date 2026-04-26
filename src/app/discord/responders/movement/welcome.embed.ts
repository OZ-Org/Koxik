import { replyLang } from '@app/functions/utils/replyLang.js';
import { GuildController } from '@app/jobs/GuildController.js';
import { registerResponder, createResponder } from '@base';
import {
	ActionRowBuilder,
	ModalBuilder,
	TextInputBuilder,
	TextInputStyle,
} from 'discord.js';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/welcome/embed/{guildId}',
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
			const embedConfig = config?.embed ?? { enabled: false };

			const description = [
				replyLang(interaction.locale, 'welcome#embed#currentStatus', {
					status: embedConfig.enabled
						? replyLang(interaction.locale, 'welcome#toggle#enabled')
						: replyLang(interaction.locale, 'welcome#toggle#disabled'),
				}),
				'',
				`**${replyLang(interaction.locale, 'welcome#embed#variables')}:**`,
				`• \`{user}\` - ${replyLang(interaction.locale, 'welcome#embed#varUser')}`,
				`• \`{user.name}\` - ${replyLang(interaction.locale, 'welcome#embed#varUserName')}`,
				`• \`{user.displayname}\` - ${replyLang(interaction.locale, 'welcome#embed#varDisplayName')}`,
				`• \`{user.id}\` - ${replyLang(interaction.locale, 'welcome#embed#varUserId')}`,
				`• \`{user.avatar}\` - ${replyLang(interaction.locale, 'welcome#embed#varAvatar')}`,
				`• \`{server.name}\` - ${replyLang(interaction.locale, 'welcome#embed#varServerName')}`,
				`• \`{server.count}\` - ${replyLang(interaction.locale, 'welcome#embed#varMemberCount')}`,
				'',
				replyLang(interaction.locale, 'welcome#embed#instruction'),
			].join('\n');

			const { EmbedBuilder, ButtonBuilder, ButtonStyle } = await import(
				'discord.js'
			);
			const { createRow } = await import('@magicyan/discord');

			const embed = new EmbedBuilder()
				.setTitle(replyLang(interaction.locale, 'welcome#embed#title'))
				.setDescription(description)
				.setColor('#0c0a09');

			const row = createRow(
				new ButtonBuilder()
					.setLabel(
						embedConfig.enabled
							? replyLang(interaction.locale, 'welcome#embed#disableEmbed')
							: replyLang(interaction.locale, 'welcome#embed#enableEmbed'),
					)
					.setStyle(
						embedConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success,
					)
					.setCustomId(`gen/welcome/embed/toggle/${guildId}`),
				new ButtonBuilder()
					.setLabel(replyLang(interaction.locale, 'welcome#embed#editTitle'))
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`gen/welcome/embed/title/${guildId}`),
				new ButtonBuilder()
					.setLabel(replyLang(interaction.locale, 'welcome#embed#editColor'))
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`gen/welcome/embed/color/${guildId}`),
				new ButtonBuilder()
					.setLabel(replyLang(interaction.locale, 'welcome#embed#editFooter'))
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`gen/welcome/embed/footer/${guildId}`),
				new ButtonBuilder()
					.setLabel(replyLang(interaction.locale, 'welcome#panel#back'))
					.setStyle(ButtonStyle.Secondary)
					.setCustomId(`gen/welcome/${guildId}`),
			);

			return res.update().raw({
				embeds: [embed],
				components: [row],
			});
		},
	}),
);

registerResponder(
	createResponder({
		type: 'button',
		customId: 'gen/welcome/embed/toggle/{guildId}',
		run: async ({ interaction, res, useParams }) => {
			const { guildId } = useParams();

			if (!interaction.guild) return;

			await res.ephemeral().defer();

			const config = await GuildController.getWelcomeConfig(guildId);
			const embedConfig = config?.embed ?? { enabled: false };

			await GuildController.setMovementLog(guildId, 'welcome', {
				embed: { enabled: !embedConfig.enabled },
			});

			return res.update().normal(
				replyLang(interaction.locale, 'welcome#embed#toggled', {
					status: !embedConfig.enabled
						? replyLang(interaction.locale, 'welcome#toggle#enabled')
						: replyLang(interaction.locale, 'welcome#toggle#disabled'),
				}),
			);
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

function buildEmbedModalHandler(
	type: 'title' | 'color' | 'footer' | 'imageUrl' | 'thumbnailUrl',
) {
	const configs = {
		title: {
			modal: 'welcome-embed-title',
			panel: 'gen/welcome/embed/title/{guildId}',
			langTitle: 'welcome#embed#editTitle',
			langLabel: 'welcome#embed#titleLabel',
			langPlaceholder: 'welcome#embed#titlePlaceholder',
			langSuccess: 'welcome#embed#titleSaved',
			langField: 'title',
		},
		color: {
			modal: 'welcome-embed-color',
			panel: 'gen/welcome/embed/color/{guildId}',
			langTitle: 'welcome#embed#editColor',
			langLabel: 'welcome#embed#colorLabel',
			langPlaceholder: 'welcome#embed#colorPlaceholder',
			langSuccess: 'welcome#embed#colorSaved',
			langField: 'color',
		},
		footer: {
			modal: 'welcome-embed-footer',
			panel: 'gen/welcome/embed/footer/{guildId}',
			langTitle: 'welcome#embed#editFooter',
			langLabel: 'welcome#embed#footerLabel',
			langPlaceholder: 'welcome#embed#footerPlaceholder',
			langSuccess: 'welcome#embed#footerSaved',
			langField: 'footer',
		},
		imageUrl: {
			modal: 'welcome-embed-image',
			panel: 'gen/welcome/embed/image/{guildId}',
			langTitle: 'welcome#embed#editImage',
			langLabel: 'welcome#embed#imageLabel',
			langPlaceholder: 'welcome#embed#imagePlaceholder',
			langSuccess: 'welcome#embed#imageSaved',
			langField: 'imageUrl',
		},
		thumbnailUrl: {
			modal: 'welcome-embed-thumbnail',
			panel: 'gen/welcome/embed/thumbnail/{guildId}',
			langTitle: 'welcome#embed#editThumbnail',
			langLabel: 'welcome#embed#thumbnailLabel',
			langPlaceholder: 'welcome#embed#thumbnailPlaceholder',
			langSuccess: 'welcome#embed#thumbnailSaved',
			langField: 'thumbnailUrl',
		},
	} as const;

	const cfg = configs[type];

	registerResponder(
		createResponder({
			type: 'button',
			customId: cfg.panel,
			run: async ({ interaction, useParams }) => {
				const { guildId } = useParams();

				if (!interaction.guild) return;

				const currentConfig = await GuildController.getWelcomeConfig(guildId);
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

				await res.ephemeral().defer();

				const currentConfig = await GuildController.getWelcomeConfig(guildId);
				const embedConfig = currentConfig?.embed ?? { enabled: false };

				await GuildController.setMovementLog(guildId, 'welcome', {
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

buildEmbedModalHandler('title');
buildEmbedModalHandler('color');
buildEmbedModalHandler('footer');
buildEmbedModalHandler('imageUrl');
buildEmbedModalHandler('thumbnailUrl');
