// all-regex is from https://github.com/kedyjs/discord-advanced-regex

import { createSubCommand } from '@base';
import { replyLang } from '@fx/utils/replyLang.js';
import {
	AutoModerationActionType,
	AutoModerationRuleEventType,
	AutoModerationRuleTriggerType,
	PermissionsBitField,
} from 'discord.js';

export default createSubCommand({
	name: 'servers',
	description: 'Block discord server links!',
	description_localizations: {
		'pt-BR': 'Bloqueie links de servidores do discord!',
		'es-ES': 'Bloquear enlaces de servidores de discord!',
	},
	default_member_permissions: [PermissionsBitField.Flags.ManageGuild],
	run: async ({ interaction, res }) => {
		const guild = interaction.guild;
		if (!guild) return;

		const me = await guild.members.fetchMe();

		if (!me.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
			return res
				.ephemeral()
				.crying(
					replyLang(interaction.locale, 'automod#no_permission'),
					interaction.locale,
				);
		}

		const rules = await guild.autoModerationRules.fetch();
		const automod = rules.find(
			(rule) => rule.name === 'Discord Server Links (Koxik)',
		);

		if (automod) {
			try {
				await automod.delete();
			} catch (err: any) {
				// Ignore 404 (already deleted)
				if (err.code !== 10003 && err.status !== 404) {
					throw err;
				}
			}
			return res
				.ephemeral()
				.normal(replyLang(interaction.locale, 'automod#disabled'));
		}

		if (!automod) {
			await guild.autoModerationRules.create({
				name: 'Discord Server Links (Koxik)',
				eventType: AutoModerationRuleEventType.MessageSend,
				actions: [
					{
						type: AutoModerationActionType.BlockMessage,
						metadata: {
							customMessage: replyLang(
								interaction.locale,
								'automod#block_message',
							),
						},
					},
				],
				triggerType: AutoModerationRuleTriggerType.Keyword,
				triggerMetadata: {
					regexPatterns: [
						'(?:https?://)?(?:www.|ptb.|canary.)?(?:dsc.gg|invite.gg|discord.link|(?:discord.(?:gg|io|me|li|id))|disboard.org|discord(?:app)?.(?:com|gg)/(?:invite|servers))/[a-z0-9-_]+',
					],
				},
				enabled: true,
			});

			return res
				.ephemeral()
				.normal(replyLang(interaction.locale, 'automod#enabled'));
		}
	},
});
