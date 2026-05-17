import { createResponder, registerResponder } from '@base';
import {
	handleGiveawayJoinButton,
	handleGiveawayManageButton,
	handleGiveawayEndButton,
	handleGiveawayRerollButton,
} from '@app/discord/commands/moderation/giveaway.js';

registerResponder(
	createResponder({
		customId: 'giveaway_join_*',
		type: 'button',
		run: async ({ interaction, res }) => {
			await handleGiveawayJoinButton(interaction, res);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'giveaway_manage_*',
		type: 'button',
		run: async ({ interaction, res }) => {
			await handleGiveawayManageButton(interaction, res);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'giveaway_end_*',
		type: 'button',
		run: async ({ interaction, res }) => {
			await handleGiveawayEndButton(interaction, res);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'giveaway_reroll_*',
		type: 'button',
		run: async ({ interaction, res }) => {
			await handleGiveawayRerollButton(interaction, res);
		},
	}),
);
