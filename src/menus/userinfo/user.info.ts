import { replyLang } from '@fx/utils/replyLang.js';
import {
	brBuilder,
	createContainer,
	createThumbArea,
	createThumbnail,
} from '@magicyan/discord';
import {
	EmbedBuilder,
	type Locale,
	resolveColor,
	type User as UserDiscord,
} from 'discord.js';
import { emotes } from 'misc/emotes.js';
import type { User as UserDB } from '../../generated/prisma/client.js';

const { badges } = emotes;
const KOXIK_ID = '1358116081126084608';

// Calcula XP necessário pro próximo level
function getTotalXPForNextLevel(level: number): number {
	return Math.floor(50 * level ** 1.5);
}

// Cria barra de XP com percentual
function createXPBar(xp: number, level: number): string {
	const totalXP = getTotalXPForNextLevel(level);
	const filledBlocks = Math.floor((xp / totalXP) * 10);
	const emptyBlocks = 10 - filledBlocks;
	const percent = Math.floor((xp / totalXP) * 100);
	return `${xp}/${totalXP} XP (${percent}%)\n${'🟩'.repeat(filledBlocks)}${'⬛'.repeat(emptyBlocks)}`;
}

// Badges do usuário
function createUserBadges(
	userDiscord: UserDiscord,
	userDB: UserDB | null,
	locale: Locale,
): string[] {
	const userBadges: string[] = [];
	type BadgeKeys = keyof typeof badges;

	if (userDB?.badges) {
		for (const b of userDB.badges as { badge_id: BadgeKeys }[]) {
			if (badges[b.badge_id]) userBadges.push(badges[b.badge_id]);
		}
	}

	if (userDiscord.bot) userBadges.push(badges.bot);
	if (userDiscord.id === KOXIK_ID) userBadges.push(badges.developer);

	if (userBadges.length === 0) {
		userBadges.push(replyLang(locale, 'user#info#noBadges'));
	}

	return userBadges;
}

// Função principal do embed/container
export function createUserInfoEmbed(
	userDiscord: UserDiscord,
	userDB: UserDB | null,
	locale: Locale,
) {
	const userBadges = createUserBadges(userDiscord, userDB, locale);

	const xpBar =
		userDB?.xp != null && userDB?.level != null
			? createXPBar(userDB.xp, userDB.level)
			: null;

	const relationshipField = userDB?.marriedWith
		? brBuilder('💍 Casado com:', `<@${userDB.marriedWith}>`)
		: userDB?.datingWith
			? brBuilder('💖 Namorando com:', `<@${userDB.datingWith}>`)
			: null;

	const container = createContainer(
		resolveColor('#752E2B'),
		createThumbArea(
			brBuilder(
				`# 👤 ${userDiscord.globalName ?? userDiscord.username}`,
				`### ${replyLang(locale, 'user#info#description')}`,
			),
			createThumbnail(userDiscord.displayAvatarURL()),
		),
		brBuilder('### Suas badges:', `## ${userBadges.join(' ')}`),
		...(xpBar ? [brBuilder(xpBar)] : []),
		userDB?.bank != null ? brBuilder('### Banco:', `P$ ${userDB.bank}`) : [],
		userDB?.mining_resources
			? brBuilder(
					'### Recursos de mineração:',
					`\`\`\`json\n${JSON.stringify(userDB.mining_resources, null, 2)}\n\`\`\``,
				)
			: [],
		...(relationshipField ? [relationshipField] : []),
	);

	const embed = new EmbedBuilder()
		.setColor(0xff7f50)
		.setAuthor({
			name: `👤 ${userDiscord.username}`,
			iconURL: userDiscord.displayAvatarURL(),
		})
		.setThumbnail(userDiscord.displayAvatarURL({ size: 256 }))
		.setDescription(replyLang(locale, 'user#info#description'))
		.addFields(
			{
				name: replyLang(locale, 'user#info#badges'),
				value: userBadges.join(' ') || replyLang(locale, 'user#info#noBadges'),
				inline: false,
			},
			{
				name: replyLang(locale, 'user#info#accountCreated'),
				value: `<t:${Math.floor(userDiscord.createdTimestamp / 1000)}:F>`,
				inline: true,
			},
			{
				name: replyLang(locale, 'user#info#level'),
				value: userDB?.level?.toString() ?? '-',
				inline: true,
			},
			{
				name: replyLang(locale, 'user#info#xp'),
				value: xpBar ?? '-',
				inline: true,
			},
			{
				name: replyLang(locale, 'user#info#balance'),
				value: userDB ? `P$ ${userDB.balance}` : '-',
				inline: true,
			},
			...(userDB?.bank != null
				? [{ name: 'Banco', value: `P$ ${userDB.bank}`, inline: true }]
				: []),
			...(userDB?.mining_resources
				? [
						{
							name: 'Recursos de mineração',
							value: `\`\`\`json\n${JSON.stringify(userDB.mining_resources, null, 2)}\n\`\`\``,
							inline: false,
						},
					]
				: []),
			...(relationshipField
				? [
						{
							name: relationshipField.split(':')[0],
							value: relationshipField.split(':')[1],
							inline: false,
						},
					]
				: []),
		);

	if (userDB?.lastDaily) {
		embed.addFields({
			name: replyLang(locale, 'user#info#lastDaily'),
			value: `<t:${Math.floor(userDB.lastDaily.getTime() / 1000)}:R>`,
			inline: false,
		});
	}

	return { container, embed };
}
