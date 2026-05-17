import { createResponder, registerResponder } from '@base';
import { handleGiveawayJoinButton } from '@app/discord/commands/moderation/giveaway.js';

registerResponder(
	createResponder({
		customId: 'giveaway_join_*',
		type: 'button',
		run: async ({ interaction, res }) => {
			await handleGiveawayJoinButton(interaction, res);
		},
	}),
);
