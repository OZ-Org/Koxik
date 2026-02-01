import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { type CanvasRenderingContext2D, loadImage } from 'canvas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BADGES_DIR = path.resolve(__dirname, '../../../../public/badges');

export function sanitizeText(text: string): string {
	return text
		.replace(/\r?\n|\r/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

export function clampText(text: string, maxChars: number): string {
	if (text.length <= maxChars) return text;
	return text.slice(0, maxChars - 3) + '...';
}

export function wrapText(
	ctx: CanvasRenderingContext2D,
	text: string,
	x: number,
	y: number,
	maxWidth: number,
	lineHeight: number,
	maxLines: number,
) {
	if (!text) return;

	const words = text.split(' ');
	let line = '';
	let lines = 0;

	for (const word of words) {
		const test = line + word + ' ';
		const { width } = ctx.measureText(test);

		if (width > maxWidth) {
			ctx.fillText(line, x, y);
			line = word + ' ';
			y += lineHeight;
			lines++;

			if (lines >= maxLines - 1) {
				ctx.fillText(line.trim() + '...', x, y);
				return;
			}
		} else {
			line = test;
		}
	}

	ctx.fillText(line, x, y);
}

export function roundedRect(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	w: number,
	h: number,
	r: number,
) {
	ctx.beginPath();
	ctx.moveTo(x + r, y);
	ctx.lineTo(x + w - r, y);
	ctx.quadraticCurveTo(x + w, y, x + w, y + r);
	ctx.lineTo(x + w, y + h - r);
	ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
	ctx.lineTo(x + r, y + h);
	ctx.quadraticCurveTo(x, y + h, x, y + h - r);
	ctx.lineTo(x, y + r);
	ctx.quadraticCurveTo(x, y, x + r, y);
	ctx.closePath();
}

export function infoBox(
	ctx: CanvasRenderingContext2D,
	emoji: string,
	title: string,
	value: string,
	x: number,
	y: number,
) {
	const paddingX = 14;
	const paddingTop = 10;

	ctx.fillStyle = 'rgba(30,25,45,0.9)';
	roundedRect(ctx, x, y, 170, 50, 14);
	ctx.fill();

	ctx.font = '16px "Emoji"';
	ctx.fillStyle = '#ffffff';
	ctx.fillText(emoji, x + paddingX - 6, y + paddingTop + 10);

	ctx.font = '14px "OpenSans"';
	ctx.fillStyle = '#c7c7c7';
	ctx.fillText(title, x + paddingX + 22, y + paddingTop + 10);

	ctx.font = '18px "OpenSans"';
	ctx.fillStyle = '#ffffff';
	ctx.fillText(value, x + paddingX, y + paddingTop + 34);
}

type BadgeInput = { badge_id: string };

interface DrawBadgesOptions {
	x: number;
	y: number;
	size: number;
	gap: number;
	maxPerRow: number;
}

export async function drawBadges(
	ctx: CanvasRenderingContext2D,
	config: DrawBadgesOptions,
	badges?: BadgeInput[] | null,
	isBot?: boolean,
) {
	if (!badges?.length) return;

	if (isBot) {
		badges.unshift({ badge_id: 'bot' });
	}

	const { x, y, size, gap = 8, maxPerRow = 8 } = config;

	let cx = x;
	let cy = y;
	let count = 0;

	for (const badge of badges) {
		const filePath = path.join(BADGES_DIR, `${badge.badge_id}.png`);
		if (!fs.existsSync(filePath)) continue;

		try {
			const img = await loadImage(filePath);

			const isOwner = badge.badge_id === 'owner';
			const scale = isOwner ? 0.82 : 1;

			const drawSize = size * scale;
			const offset = (size - drawSize) / 2;

			ctx.drawImage(img, cx + offset, cy + offset, drawSize, drawSize);

			cx += size + gap;
			count++;

			if (count % maxPerRow === 0) {
				cx = x;
				cy += size + gap;
			}
		} catch {}
	}
}
