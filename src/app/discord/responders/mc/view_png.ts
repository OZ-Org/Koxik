import { createResponder, registerResponder } from '@base';
import { EmbedPlusBuilder } from '@magicyan/discord';
import { MessageFlags } from 'discord.js';
import { fetchSkinRender, RenderCrops, RenderTypes } from 'starlightskinapi';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'view/png/skin/{nick}',
		run: async ({ interaction, useParams }) => {
			const { nick } = useParams();

			await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

			const skin = await fetchSkinRender(nick, {
				type: RenderTypes.Skin,
				crop: RenderCrops.Default,
			});

			const embed = new EmbedPlusBuilder({
				title: `${nick}'s png skin`,
			});

			if (!skin.success) {
				return await interaction.editReply({
					content: 'This nick is invalid',
				});
			}

			embed.setImage(skin.url);

			return await interaction.editReply({
				embeds: [embed],
			});
		},
	}),
);
