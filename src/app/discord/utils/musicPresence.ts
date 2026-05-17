import type { Client } from 'discord.js';
import { ActivityType } from 'discord.js';
import type { MusicTrack } from '@basedir/music/MusicController.js';
import type { MusicController } from '@basedir/music/MusicController.js';

let sessionTrackCount = 0;
let maxTrackLimit = 0;

export function setupMusicPresence(
	client: Client,
	controller: MusicController,
): void {
	maxTrackLimit = Math.floor(Math.random() * 6) + 5;
	sessionTrackCount = 0;

	controller.on('trackStart', (track: MusicTrack) => {
		sessionTrackCount++;

		if (sessionTrackCount > maxTrackLimit) {
			controller.musicModeActive = false;
			return;
		}

		controller.musicModeActive = true;

		client.user?.setActivity(`🎵 ${track.title} — ${track.artist}`, {
			type: ActivityType.Listening,
		});
	});

	controller.on('queueEnd', () => {
		controller.musicModeActive = false;
		sessionTrackCount = 0;
	});
}
