import { ApplicationCommandOptionType, createSubCommand } from '@base';
import { mine } from '@menus/minecraft/mine.js';
import { UserController } from 'app/jobs/UserController.js';

export default createSubCommand({
	name: 'mine',
	name_localizations: {
		'pt-BR': 'minerar',
		'es-ES': 'mío',
	},
	description:
		'Mine minecraft ores but now on discord, and exchange for more things!',
	description_localizations: {
		'pt-BR':
			'Minere minérios do Minecraft, mas agora no Discord e troque por mais coisas!',
		'es-ES':
			'¡Extrae minerales de Minecraft, pero ahora en Discord y cámbialos por más cosas!',
	},
	cooldown: 5,
	options: [
		{
			name: 'pickaxe',
			name_localizations: {
				'es-ES': 'piqueta',
				'pt-BR': 'picareta',
			},
			description: 'Which pickaxe will you mine with?',
			description_localizations: {
				'es-ES': '¿Con qué pico minarás?',
				'pt-BR': 'Com qual picareta você vai minerar?',
			},
			type: ApplicationCommandOptionType.String,
			required: true,
			autocomplete: true,
		},
	],
	run: async ({ interaction }) => {
		await mine(interaction);
	},
	autocomplete: async ({ interaction }) => {
		const user = interaction.user;
		const backpack = await UserController.getBackpack(user.id);

		if (!backpack || backpack.length === 0) {
			return interaction.respond([]);
		}

		const pickaxes = backpack.filter((i: any) => i.type === 'pickaxe');

		return interaction.respond(
			pickaxes.map((pk: any) => ({
				name: `${pk.name} (Durabilidade: ${pk.durability})`,
				value: pk.id,
			})),
		);
	},
});
