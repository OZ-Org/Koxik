import { UserController } from '@app/jobs/UserController.js';
import { ApplicationCommandOptionType, createSubCommand } from '@base';

export default createSubCommand({
	name: 'aboutme',
	name_localizations: {
		'pt-BR': 'sobremim',
		'es-ES': 'acercade',
	},

	description: 'Change your About me in profile!',
	description_localizations: {
		'pt-BR': 'Altere o seu "Sobre mim" no perfil!',
		'es-ES': '¡Cambia tu "Sobre mí" en el perfil!',
	},

	cooldown: 60,

	options: [
		{
			name: 'text',
			name_localizations: {
				'pt-BR': 'texto',
				'es-ES': 'texto',
			},

			description: 'Your text',
			description_localizations: {
				'pt-BR': 'Seu texto',
				'es-ES': 'Tu texto',
			},

			type: ApplicationCommandOptionType.String,
			required: true,
			max_length: 200,
			min_length: 2,
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
