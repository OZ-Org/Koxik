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
	name: 'links',
	description: 'Block discord links!',
	description_localizations: {
		'pt-BR': 'Bloqueie links!',
		'es-ES': 'Bloquear enlaces!',
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
		const automod = rules.find((rule) => rule.name === 'Discord Links (Koxik)');

		if (automod) {
			try {
				await automod.delete();
			} catch (err: any) {
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
				name: 'Discord Links (Koxik)',
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
						'\\[.*[a-z0-9_\\-]+\\.[a-z]{2,}[\\/]?.*\\]\\(<?(?:https?://)?[a-z0-9_\\-\\.]*[a-z0-9_\\-]+\\.[a-z]{2,}.*>?\\)',
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
