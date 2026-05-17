import { EventEmitter } from 'node:events';
import { env } from '@env';

export interface MusicTrack {
	id: string;
	title: string;
	artist: string;
	album: string | null;
	cover: string;
	url: string;
	durationMs: number;
}

interface TrackData {
	playing: boolean;
	track: MusicTrack;
	progressMs: number;
}

const POLL_INTERVAL_MS = 10_000;
const GAP_TIMEOUT_MS = 20_000;

export class MusicController extends EventEmitter {
	private pollTimer: ReturnType<typeof setInterval> | null = null;
	private gapTimer: ReturnType<typeof setTimeout> | null = null;
	private _currentTrack: MusicTrack | null = null;

	/** Controlled by musicPresence to signal whether presence override is active */
	musicModeActive = false;

	get isPlaying(): boolean {
		return this._currentTrack !== null;
	}

	get currentTrack(): MusicTrack | null {
		return this._currentTrack;
	}

	get hasApi(): boolean {
		return !!env.MUSIC_API;
	}

	start(): void {
		if (this.pollTimer) return;
		if (!this.hasApi) return;

		this.pollTimer = setInterval(() => this.poll(), POLL_INTERVAL_MS);
		this.poll();
	}

	stop(): void {
		this.clearGapTimer();

		if (this.pollTimer) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}

		this._currentTrack = null;
		this.musicModeActive = false;
	}

	private async poll(): Promise<void> {
		const apiUrl = env.MUSIC_API;
		if (!apiUrl) return;

		try {
			const response = await fetch(`${apiUrl}/music/current`, {
				signal: AbortSignal.timeout(5_000),
			});

			if (!response.ok) return this.handleNoTrack();

			const data: TrackData = await response.json();
			if (
				!data.playing ||
				!data.track?.id ||
				!data.track?.title ||
				!data.track?.artist
			)
				return this.handleNoTrack();

			this.handleTrack(data.track);
		} catch {
			// Network error — keep current state, next poll will retry
		}
	}

	private handleNoTrack(): void {
		if (this.gapTimer) return;
		if (!this._currentTrack) return;

		this.gapTimer = setTimeout(() => {
			this.gapTimer = null;
			this.musicModeActive = false;
			const ended = this._currentTrack;
			this._currentTrack = null;
			this.emit('queueEnd', ended);
		}, GAP_TIMEOUT_MS);
	}

	private handleTrack(track: MusicTrack): void {
		if (this.gapTimer) {
			clearTimeout(this.gapTimer);
			this.gapTimer = null;
		}

		if (this._currentTrack && track.id === this._currentTrack.id) return;

		if (this._currentTrack) {
			this.emit('trackEnd', this._currentTrack);
		}

		this._currentTrack = track;
		this.emit('trackStart', track);
	}

	private clearGapTimer(): void {
		if (this.gapTimer) {
			clearTimeout(this.gapTimer);
			this.gapTimer = null;
		}
	}
}
