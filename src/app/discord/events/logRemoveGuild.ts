import { createEvent } from "@base";
import { env } from "@env";
import { createWebhookClient } from "@magicyan/discord";
import {
  EmbedBuilder,
  PermissionsBitField,
  GuildVerificationLevel,
} from "discord.js";

export default createEvent({
  name: "log:guild:delete",
  event: "guildDelete",
  run: async (guild) => {
    const logWebhook = createWebhookClient(env.LOGS_WEBHOOK_URL);
    if (!logWebhook) return;

    const botCount = guild.members?.cache.filter(m => m.user.bot).size ?? 0;
    const adminRoles =
      guild.roles?.cache.filter(role =>
        role.permissions.has(PermissionsBitField.Flags.Administrator),
      ).size ?? 0;

    const guildAgeDays = guild.createdTimestamp
      ? Math.floor(
        (Date.now() - guild.createdTimestamp) /
        (1000 * 60 * 60 * 24),
      )
      : null;

    const riskNotes: string[] = [];

    if (guildAgeDays !== null && guildAgeDays < 7)
      riskNotes.push("Servidor muito novo");
    if (adminRoles > 10) riskNotes.push("Admins em excesso");
    if (
      guild.verificationLevel === GuildVerificationLevel.None
    )
      riskNotes.push("Sem verificação");
    if (botCount > (guild.memberCount ?? 0) * 0.3)
      riskNotes.push("Alta proporção de bots");

    const embed = new EmbedBuilder()
      .setTitle("🪦 Bot removido de servidor")
      .setColor(0xed4245)
      .setThumbnail(guild.iconURL({ size: 256 }))
      .addFields(
        {
          name: "Servidor",
          value:
            `**${guild.name ?? "Desconhecido"}**\n` +
            `ID: \`${guild.id}\`\n` +
            (guildAgeDays !== null
              ? `Criado há **${guildAgeDays} dias**`
              : "Idade desconhecida"),
        },
        {
          name: "Membros (último snapshot)",
          value:
            guild.memberCount !== undefined
              ? `👥 ${guild.memberCount}\n🤖 Bots: ${botCount}`
              : "Dados indisponíveis",
          inline: true,
        },
        {
          name: "Configuração",
          value:
            `🔐 Verificação: **${GuildVerificationLevel[guild.verificationLevel]
            }**\n` +
            `🚀 Boosts: **${guild.premiumSubscriptionCount ?? 0}**`,
          inline: true,
        },
        {
          name: "Permissões sensíveis",
          value: `Cargos com ADMIN: **${adminRoles}**`,
          inline: true,
        },
        {
          name: "🧠 Avaliação final",
          value:
            riskNotes.length > 0
              ? riskNotes.map(r => `• ${r}`).join("\n")
              : "Nenhum sinal crítico aparente",
        },
      )
      .setFooter({
        text: "Guild exit audit log • nada some de verdade",
      })
      .setTimestamp();

    await logWebhook.send({ embeds: [embed] });
  },
});
