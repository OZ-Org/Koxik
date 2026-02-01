import { createResponder, registerResponder } from '@base';

registerResponder(
	createResponder({
		type: 'button',
		customId: 'profile/{id}',
		run: async ({ interaction, res }) => {
			return res
				.ephemeral()
				.info(
					interaction.locale === 'pt-BR'
						? 'Essa função ainda não foi implementada, espera mais um pouquinho!'
						: interaction.locale === 'es-ES'
							? 'Esta función aún no ha sido implementada, ¡espera un poquito más!'
							: 'This feature hasnt been implemented yet, please wait just a little longer!',
				);
		},
	}),
);
