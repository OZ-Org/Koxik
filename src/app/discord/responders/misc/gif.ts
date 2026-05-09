import { registerResponder, createResponder } from '@base';
import { gifs } from '@misc/gifs.js';

registerResponder(
	createResponder({
		customId: 'gif/source/{type}/{index}',
		type: 'button',
		run: async ({ useParams, res }) => {
			const { type, index } = useParams();

			const gif = gifs[type as keyof typeof gifs]?.[Number(index)];

			if (!gif) {
				return res.ephemeral().error('404, try again later!');
			}

			return res
				.ephemeral()
				.info(`Source: **${gif.source ?? 'Desconhecido'}**`);
		},
	}),
);
