import { createResponder, registerResponder } from '@base';
import {
	handleGiveawayJoinButton,
	handleGiveawayManageButton,
	handleGiveawayEndButton,
	handleGiveawayRerollButton,
} from '@app/discord/commands/moderation/giveaway.js';

registerResponder(
	createResponder({
		customId: 'giveaway/join/{giveawayId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { giveawayId } = useParams();
			await handleGiveawayJoinButton(interaction, giveawayId, res);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'giveaway/manage/{giveawayId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { giveawayId } = useParams();
			await handleGiveawayManageButton(interaction, giveawayId, res);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'giveaway/end/{giveawayId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { giveawayId } = useParams();
			await handleGiveawayEndButton(interaction, giveawayId, res);
		},
	}),
);

registerResponder(
	createResponder({
		customId: 'giveaway/reroll/{giveawayId}',
		type: 'button',
		run: async ({ interaction, useParams, res }) => {
			const { giveawayId } = useParams();
			await handleGiveawayRerollButton(interaction, giveawayId, res);
		},
	}),
);
