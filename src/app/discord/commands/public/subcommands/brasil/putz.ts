import { ApplicationCommandOptionType, createSubCommand } from '@base';
import { AttachmentBuilder } from 'discord.js';

import { createCanvas, loadImage } from '@napi-rs/canvas';
import path from 'node:path';

const PutzSubCommand = createSubCommand({
	name: 'putz',

	description: 'Generate an image based on Diggo thumbnails!',

	description_localizations: {
		'pt-BR': 'Gere uma imagem baseada nas thumbnails do Diggo!',
		'es-ES': 'Genera una imagen basada en las miniaturas de Diggo!',
	},

	options: [
		{
			name: 'user',
			name_localizations: {
				'pt-BR': 'usuário',
				'es-ES': 'usuario',
			},
			description: 'User to generate the image with',
			description_localizations: {
				'pt-BR': 'Usuário para gerar a imagem',
				'es-ES': 'Usuario para generar la imagen',
			},
			type: ApplicationCommandOptionType.User,
			required: false,
		},
	],

	run: async ({ interaction, res }) => {
		await res.defer();

		const user = interaction.options.getUser('user') ?? interaction.user;

		const canvas = createCanvas(1280, 675);
		const ctx = canvas.getContext('2d');

		const BANNER_PATH = path.resolve(
			__dirname,
			'../../../../../../../public/memes/putz.png',
		);

		const background = await loadImage(BANNER_PATH);

		const avatar = await loadImage(
			user.displayAvatarURL({
				extension: 'png',
				size: 1024,
				forceStatic: true,
			}),
		);

		ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

		const left = 650;
		const top = 133;

		const right = 1210;
		const bottom = 675;

		const frameWidth = right - left;
		const frameHeight = bottom - top;

		const avatarRatio = avatar.width / avatar.height;
		const frameRatio = frameWidth / frameHeight;

		let drawWidth = frameWidth;
		let drawHeight = frameHeight;

		let offsetX = 0;
		let offsetY = 0;

		if (avatarRatio > frameRatio) {
			// imagem mais larga
			drawHeight = frameHeight;
			drawWidth = drawHeight * avatarRatio;

			offsetX = (frameWidth - drawWidth) / 2;
		} else {
			drawWidth = frameWidth;
			drawHeight = drawWidth / avatarRatio;

			offsetY = (frameHeight - drawHeight) / 2;
		}

		ctx.save();

		ctx.beginPath();
		ctx.rect(left, top, frameWidth, frameHeight);
		ctx.clip();

		ctx.drawImage(avatar, left + offsetX, top + offsetY, drawWidth, drawHeight);

		ctx.restore();

		const buffer = await canvas.encode('png');

		const attachment = new AttachmentBuilder(buffer, {
			name: 'putz.png',
		});

		await res.update().raw({
			content: `PUTZ ${user}!`,
			files: [attachment],
		});
	},
});

export { PutzSubCommand };
