import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { UserController } from '@app/jobs/UserController.js';
import { createSubCommand } from '@base';
import {
	drawBadges,
	infoBox,
	roundedRect,
	wrapText,
} from '@fx/canvas/profile.js';
import { replyLang } from '@fx/utils/replyLang.js';
import { createContainer } from '@magicyan/discord';
import { createCanvas, loadImage, registerFont } from 'canvas';
import {
	ActionRowBuilder,
	ApplicationCommandOptionType,
	AttachmentBuilder,
	ButtonBuilder,
	ButtonStyle,
	type MessageActionRowComponentBuilder,
} from 'discord.js';

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);

const FONT_PATH = path.resolve(
	__dirname,
	'../../../../../../../public/fonts/opensans.ttf',
);

const EMOJI_PATH = path.resolve(
	__dirname,
	'../../../../../../../public/fonts/NotoEmoji-Regular.ttf',
);

const banner = path.resolve(
	__dirname,
	'../../../../../../../public/images/banner.png',
);

registerFont(FONT_PATH, {
	family: 'OpenSans',
});

registerFont(EMOJI_PATH, {
	family: 'Emoji',
});

export default createSubCommand({
	name: 'view',
	name_localizations: {
		'pt-BR': 'ver',
		'es-ES': 'vista',
	},
	description: "View someone's profile!",
	description_localizations: {
		'pt-BR': 'Veja o perfil de alguém!',
		'es-ES': '¡Mira el perfil de alguien!',
	},
	options: [
		{
			name: 'user',
			name_localizations: {
				'pt-BR': 'usuário',
				'es-ES': 'usuario',
			},
			description: 'User you want to view the profile!',
			description_localizations: {
				'pt-BR': 'Usuário que você quer ver o perfil!',
				'es-ES': 'Usuario cuyo perfil quieres ver',
			},
			type: ApplicationCommandOptionType.User,
		},
	],
	cooldown: 10,
	run: async ({ interaction, res }) => {
		await res.ephemeral().defer();

		const discordUser =
			interaction.options.getUser('user', false) ?? interaction.user;

		const userData = await UserController.find(discordUser.id);

		if (!userData)
			return await res.error(
				replyLang(interaction.locale, 'profile#view#noAccount'),
			);

		const money = userData.balance;

		const userConfigs = userData.configs || {
			aboutme: replyLang(interaction.locale, 'profile#view#aboutDefault'),
		};
		const aboutMeText =
			userConfigs.aboutme ||
			replyLang(interaction.locale, 'profile#view#aboutDefault');

		const isABot = interaction.user.bot;

		const width = 1200;
		const height = 450;

		const canvas = createCanvas(width, height);
		const ctx = canvas.getContext('2d');

		const gradient = ctx.createLinearGradient(0, 0, width, height);
		gradient.addColorStop(0, '#1b132d');
		gradient.addColorStop(1, '#0c0816');
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, width, height);

		for (let i = 0; i < 80; i++) {
			ctx.fillStyle = 'rgba(255,255,255,0.04)';
			ctx.beginPath();
			ctx.arc(
				Math.random() * width,
				Math.random() * height,
				Math.random() * 2 + 0.5,
				0,
				Math.PI * 2,
			);
			ctx.fill();
		}

		const character = await loadImage(banner);
		ctx.drawImage(character, 600, 0, 600, height);

		ctx.globalCompositeOperation = 'multiply';
		ctx.fillStyle = 'rgba(0,0,0,0.35)';
		ctx.fillRect(600, 0, 600, height);
		ctx.globalCompositeOperation = 'source-over';

		ctx.fillStyle = 'rgba(18,15,30,0.88)';
		roundedRect(ctx, 40, 40, 460, 360, 26);
		ctx.fill();

		await drawBadges(
			ctx,
			{
				x: 180,
				y: 113,
				size: 28,
				gap: 8,
				maxPerRow: 8,
			},
			userData.badges,
			isABot
		);

		const avatar = await loadImage(
			discordUser.displayAvatarURL({ extension: 'png', size: 256 }),
		);

		ctx.save();
		ctx.beginPath();
		ctx.arc(110, 110, 46, 0, Math.PI * 2);
		ctx.clip();
		ctx.drawImage(avatar, 64, 64, 92, 92);
		ctx.restore();

		ctx.fillStyle = '#ffffff';
		ctx.font = '28px "OpenSans"';
		ctx.fillText(discordUser.username, 180, 95);

		infoBox(
			ctx,
			'⭐',
			replyLang(interaction.locale, 'profile#view#level'),
			`${userData.xp} XP`,
			70,
			180,
		);
		infoBox(
			ctx,
			'🌻',
			replyLang(interaction.locale, 'profile#view#currency'),
			money.toLocaleString(),
			260,
			180,
		);

		ctx.fillStyle = '#ffffff';
		ctx.font = '20px "OpenSans"';
		ctx.fillText(
			replyLang(interaction.locale, 'profile#view#aboutTitle'),
			70,
			285,
		);

		ctx.font = '16px "OpenSans"';
		ctx.fillStyle = '#c7c7c7';

		wrapText(ctx, aboutMeText, 70, 310, 380, 20, 3);

		const buffer = canvas.toBuffer('image/png');

		const attachment = new AttachmentBuilder(buffer, {
			name: 'profile.png',
		});

		return await res.v2(
			[
				createContainer(
					3447003,
					attachment,
					new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
						new ButtonBuilder()
							.setCustomId(`profile/${interaction.user.id}`)
							.setLabel(
								interaction.locale === 'pt-BR'
									? 'Alterar Fundo'
									: interaction.locale === 'es-ES'
										? 'Cambiar Fondo'
										: 'Change Background',
							)
							.setEmoji('🖼')
							.setStyle(ButtonStyle.Secondary),
					),
				),
			],
			{
				files: [attachment],
			},
		);
	},
});
