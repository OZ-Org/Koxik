import { ApplicationCommandOptionType, createSubCommand } from '@base';
import { EmbedBuilder } from 'discord.js';

export default createSubCommand({
	name: 'avatar',
	description: "See your or other people's avatar!",
	description_localizations: {
		'pt-BR': 'Veja seu avatar ou de outras pessoas!',
		'es-ES': '¡Vea su avatar o el de otras personas!',
	},
	options: [
		{
			name: 'user',
			description: 'Who will be chosen this time?',
			description_localizations: {
				'pt-BR': 'Quem vai ser o escolhido da vez?',
				'es-ES': '¿Quién será elegido esta vez?',
			},
			required: false,
			type: ApplicationCommandOptionType.User,
		},
	],
	async run({ interaction, res }) {
		const user = interaction.options.getUser('user', false) ?? interaction.user;

		const userAvatar = user.avatarURL({ size: 2048 });

		if (!userAvatar)
			return res.ephemeral().normal('This user does not have an avatar!');

		const embed = new EmbedBuilder({
			title: user.username,
			image: {
				url: userAvatar,
			},
		});

		return res.ephemeral().raw({ embeds: [embed] });
	},
});
