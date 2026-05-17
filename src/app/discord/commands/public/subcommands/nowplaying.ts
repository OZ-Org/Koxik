import { createSubCommand } from '@base';
import type { MusicController } from '@basedir/music/MusicController.js';
import { createEmbed } from '@magicyan/discord';
import { Colors } from 'discord.js';

export default createSubCommand({
	name: 'nowplaying',

	description: 'Show the currently playing track on the radio!',

	description_localizations: {
		'pt-BR': 'Mostre a música que está tocando agora na rádio!',
		'es-ES': '¡Muestra la canción que está sonando ahora en la radio!',
	},

	run: async ({ client, res }) => {
		const controller =
			client.getCustomVariable<MusicController>('musicController');

		if (!controller?.hasApi) {
			return res.ephemeral().info('Music API is not configured.');
		}

		if (!controller?.isPlaying || !controller.currentTrack) {
			return res.ephemeral().info('No music is currently playing.');
		}

		const track = controller.currentTrack;

		const embed = createEmbed({
			color: Colors.Purple,
			title: '🎵 Now Playing',
			description: `**${track.title}** — ${track.artist}`,
			thumbnail: { url: track.cover },
			url: track.url,
		});

		return res.raw({ embeds: [embed] });
	},
});
