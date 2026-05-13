import { env } from '@env';
import { ActivityType } from 'discord.js';

interface MusicTrack {
	title: string;
	artist: string;
	cover?: string;
}

interface MusicCurrentResponse {
	track: MusicTrack;
	progressMs: number;
}

const TIME_WINDOWS = [
	{ start: 18 * 60, end: 22 * 60 },
	{ start: 2 * 60, end: 3 * 60 },
	{ start: 5 * 60 + 30, end: 7 * 60 },
	{ start: 12 * 60, end: 14 * 60 },
];

function isInTimeWindow(): boolean {
	const now = new Date();
	const totalMinutes = now.getHours() * 60 + now.getMinutes();
	return TIME_WINDOWS.some(
		(w) => totalMinutes >= w.start && totalMinutes < w.end,
	);
}

function shouldShow(): boolean {
	return Math.random() < 0.3;
}

export async function getMusicStatus(): Promise<{
	name: string;
	type: ActivityType.Listening;
} | null> {
	if (!isInTimeWindow()) return null;
	if (!shouldShow()) return null;

	try {
		const response = await fetch(`${env.MUSIC_API}/music/current`, {
			signal: AbortSignal.timeout(5_000),
		});
		if (!response.ok) return null;

		const data: MusicCurrentResponse = await response.json();
		if (!data.track?.title || !data.track?.artist) return null;

		return {
			name: `${data.track.title} — ${data.track.artist}`,
			type: ActivityType.Listening,
		};
	} catch {
		return null;
	}
}
