interface GIFConfig {
	url: string;
	source?: string;
}

export const gifs: Record<string, GIFConfig[]> = {
	marry: [
		{
			url: 'https://i.ibb.co/Z1L45dTs/rupphire-kiss.gif',
			source: 'Steven Universe',
		},
		{
			url: 'https://i.ibb.co/2YMydWHS/Steven-pede-Connie-em-casamento-Juntos-pra-Sempre-Steven.gif',
			source: 'Steven Universe',
		},
		{
			url: 'https://i.ibb.co/R42Mg410/kiss-yes.gif',
			source: 'UP',
		},
		{
			url: 'https://i.ibb.co/nMhr77P9/homer-simpson-wedding-dress.gif',
			source: 'Simpsons',
		},
	],
	kiss: [
		{
			url: 'https://i.ibb.co/1WL8N3s/miraculous-ryuli.gif',
			source: 'Miraculous Ladybug',
		},
		{
			url: 'https://i.ibb.co/CKSqLsT1/adrienette-adrinette.gif',
			source: 'Miraculous Ladybug',
		},
		{
			url: 'https://i.ibb.co/H1HH8tb/naruto-sasuke.gif',
			source: 'Naruto',
		},
		{
			url: 'https://i.ibb.co/tPzp257B/girls-love.gif',
			source: 'Samurai Flamenco',
		},
		{
			url: 'https://i.ibb.co/7tKWkqLd/huntress-wizard-finn.gif',
			source: 'Adventure Time',
		},
		{
			url: 'https://i.ibb.co/zT3jdrWF/besar-finn.gif',
			source: 'Adventure Time',
		},
		{
			url: 'https://i.ibb.co/gMP57QX9/fionna-and-cake-winter-king.gif',
			source: 'Adventure Time with Fionna and Cake',
		},
		{
			url: 'https://i.ibb.co/Q3Zh2wGm/steven-universe-greg-rose.gif',
			source: 'Steven Universe',
		},
		{
			url: 'https://i.ibb.co/2QBCJgm/amourshipping-serena.gif',
			source: 'Pokemom XYZ',
		},
	],
};

export function getGifWithCustomId(type: keyof typeof gifs) {
	const list = gifs[type];
	const index = Math.floor(Math.random() * list.length);

	const gif = list[index];

	return {
		gif,
		customId: `gif/source/${type}/${index}`,
	};
}
