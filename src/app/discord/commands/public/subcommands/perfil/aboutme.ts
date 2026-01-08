import { UserController } from '@app/jobs/UserController.js';
import { ApplicationCommandOptionType, createSubCommand } from '@base';

export default createSubCommand({
	name: 'aboutme',
	description: 'Change your About me in profile!',
	cooldown: 60,
	options: [
		{
			name: 'texto',
			description: 'Seu texto',
			max_length: 200,
			min_value: 2,
			type: ApplicationCommandOptionType.String,
			required: true,
		},
	],
	run: async ({ interaction, res }) => {
		await res.ephemeral().defer();

		const discordId = interaction.user.id;
		const texto = interaction.options.getString('texto', true);

		const updatedUser = await UserController.updateConfigs(discordId, {
			aboutme: texto,
		});

		const configs = updatedUser.configs || { aboutme: '' };

		await res.success(
			`Seu texto atualizado para:\n\n\`\`\`${configs.aboutme}\`\`\``,
		);
	},
});
