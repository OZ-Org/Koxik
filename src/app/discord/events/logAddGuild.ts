import { createEvent } from '@base';
import { env } from '@env';
import { createWebhookClient } from '@magicyan/discord';
import {
	EmbedBuilder,
	GuildVerificationLevel,
	PermissionsBitField,
} from 'discord.js';

const ALERT_ROLE_ID = '1450860434398908720';

export default createEvent({
	name: 'log:guild:create',
	event: 'guildCreate',
	run: async (guild) => {
		const logWebhook = createWebhookClient(env.LOGS_WEBHOOK_URL);
		if (!logWebhook) return;

		const owner = await guild.fetchOwner();

		const adminRoles = guild.roles.cache.filter((role) =>
			role.permissions.has(PermissionsBitField.Flags.Administrator),
		);

		const botCount = guild.members.cache.filter((m) => m.user.bot).size;

		const guildAgeDays = Math.floor(
			(Date.now() - guild.createdTimestamp) / (1000 * 60 * 60 * 24),
		);

		const ownerAgeDays = Math.floor(
			(Date.now() - owner.user.createdTimestamp) / (1000 * 60 * 60 * 24),
		);

		/* ───────────────
       Hostility Score
       ─────────────── */
		let score = 0;
		const flags: string[] = [];

		if (guildAgeDays < 7) {
			score += 2;
			flags.push('Servidor muito novo');
		}

		if (ownerAgeDays < 14) {
			score += 2;
			flags.push('Conta do owner recente');
		}

		if (botCount > guild.memberCount * 0.3) {
			score += 2;
			flags.push('Muitos bots');
		}

		if (adminRoles.size > 10) {
			score += 1;
			flags.push('Admins em excesso');
		}

		if (guild.verificationLevel === GuildVerificationLevel.None) {
			score += 1;
			flags.push('Sem verificação');
		}

		const suspiciousNamePatterns = [
			/free\s*nitro/i,
			/raid/i,
			/nuke/i,
			/hack/i,
			/spam/i,
			/giveaway/i,
			/18\+/i,
			/nsfw/i,
			/bot\s*test/i,
		];

		if (suspiciousNamePatterns.some((r) => r.test(guild.name))) {
			score += 3;
			flags.push('Nome suspeito');
		}

		const isHostile = score >= 7;

		const embed = new EmbedBuilder()
			.setTitle(isHostile ? '🚨 Guild HOSTIL detectada' : '🛡️ Guild ingressada')
			.setColor(isHostile ? 0xed4245 : score >= 4 ? 0xfaa61a : 0x57f287)
			.setThumbnail(guild.iconURL({ size: 256 }))
			.addFields(
				{
					name: 'Servidor',
					value: `**${guild.name}**\nID: \`${guild.id}\`\nCriado há **${guildAgeDays} dias**`,
				},
				{
					name: 'Owner',
					value:
						`${owner.user.tag}\n` +
						`ID: \`${owner.id}\`\n` +
						`Conta criada há **${ownerAgeDays} dias**`,
				},
				{
					name: 'Score de Hostilidade',
					value: `🔥 **${score} / 10**`,
				},
				{
					name: '⚠️ Sinais detectados',
					value: flags.length
						? flags.map((f) => `• ${f}`).join('\n')
						: 'Nenhum',
				},
			)
			.setFooter({ text: `Guild audit • ${guild.id}` })
			.setTimestamp();

		await logWebhook.send({
			content: isHostile ? `<@&${ALERT_ROLE_ID}>` : undefined,
			embeds: [embed],
		});
	},
});
