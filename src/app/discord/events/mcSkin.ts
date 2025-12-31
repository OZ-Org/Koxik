import { createEvent } from '@base';
import { EmbedPlusBuilder } from '@magicyan/discord';
import { MessageFlags } from 'discord.js';
import { fetchSkinRender, RenderCrops, RenderTypes } from 'starlightskinapi';

export default createEvent({
	name: 'buttons:mc:skin',
	event: 'interactionCreate',
	once: false,
	run: async (ctx): Promise<any> => {
		if (ctx.isButton()) {
			if (ctx.customId.startsWith('view/png/skin/')) {
				const nick = ctx.customId.split('view/png/skin/').pop() ?? 'h';

				await ctx.deferReply({ flags: [MessageFlags.Ephemeral] });
				const skin = await fetchSkinRender(nick, {
					type: RenderTypes.Skin,
					crop: RenderCrops.Default,
				});

				const embed = new EmbedPlusBuilder({
					title: `${nick}'s png skin`,
				});

				if (!skin.success) {
					return await ctx.editReply({
						content: 'This nick is invalid',
					});
				}

				embed.setImage(skin.url);

				return await ctx.editReply({
					embeds: [embed],
				});
			}
		}
	},
});
