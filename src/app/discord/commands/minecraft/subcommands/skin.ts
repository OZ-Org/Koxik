import { ApplicationCommandOptionType, createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import { createRow, EmbedPlusBuilder } from '@magicyan/discord';
import { ButtonBuilder, ButtonStyle } from 'discord.js';
import { fetchSkinRender, RenderCrops, RenderTypes } from 'starlightskinapi';

const BLACKLISTED_NICKS = ['pedra'];

export default createSubCommand({
	name: 'skin',
	name_localizations: {
		'pt-BR': 'skin',
		'en-US': 'skin',
		'es-ES': 'skin',
	},
	description: 'View minecraft skins!',
	description_localizations: {
		'pt-BR': 'Veja skins do Minecraft!',
		'en-US': 'View Minecraft skins!',
		'es-ES': 'Ver skins de Minecraft!',
	},
	options: [
		{
			name: 'nick',
			name_localizations: {
				'pt-BR': 'nick',
				'en-US': 'nick',
				'es-ES': 'nick',
			},
			description: '(Java Only) Minecraft nick',
			description_localizations: {
				'pt-BR': '(Apenas Java) Nick do Minecraft',
				'en-US': '(Java Only) Minecraft nickname',
				'es-ES': '(Solo Java) Nick de Minecraft',
			},
			type: ApplicationCommandOptionType.String,
			required: true,
		},
		{
			name: 'pose',
			name_localizations: {
				'pt-BR': 'pose',
				'en-US': 'pose',
				'es-ES': 'pose',
			},
			description: 'Pose for render',
			description_localizations: {
				'pt-BR': 'Pose do render',
				'en-US': 'Render pose',
				'es-ES': 'Pose del render',
			},
			type: ApplicationCommandOptionType.String,
			choices: [
				{
					name: 'Default pose',
					name_localizations: {
						'pt-BR': 'Pose padrão',
						'en-US': 'Default pose',
						'es-ES': 'Pose por defecto',
					},
					value: 'default',
				},
				{
					name: 'Sit pose',
					name_localizations: {
						'pt-BR': 'Pose sentada',
						'en-US': 'Sit pose',
						'es-ES': 'Pose sentada',
					},
					value: 'sit',
				},
			],
			required: false,
		},
	],
	cooldown: 3,
	run: async ({ interaction, res }) => {
		await res.ephemeral().defer();

		const nick = interaction.options.getString('nick', true);
		const pose = interaction.options.getString('pose');
		const normalizedNick = nick.toLowerCase();

		if (BLACKLISTED_NICKS.includes(normalizedNick)) {
			return res.error(replyLang(interaction.locale, 'mc#skin#invalid_nick'));
		}

		const poseType =
			pose === 'sit' ? RenderTypes.CrissCross : RenderTypes.Default;

		const skin = await fetchSkinRender(nick, {
			type: poseType,
			crop: RenderCrops.Full,
		});

		if (!skin.success) {
			return res.error(replyLang(interaction.locale, 'mc#skin#invalid_nick'));
		}

		const row = createRow(
			new ButtonBuilder({
				label: 'PNG',
				style: ButtonStyle.Secondary,
				customId: `view/png/skin/${normalizedNick}`,
			}),
		);

		const embed = new EmbedPlusBuilder({
			title: nick,
		}).setImage(skin.url);

		return res.raw({
			embeds: [embed],
			components: [row],
		});
	},
});
