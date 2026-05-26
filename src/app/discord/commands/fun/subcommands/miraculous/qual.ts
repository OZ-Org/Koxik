import { createSubCommand } from '@base';
import { createContainer, createSection } from '@magicyan/discord';
import { replyLang } from '@app/functions/utils/replyLang.js';

const miraculous = [
	{
		id: 1,
		name: {
			'pt-BR': 'Joaninha',
			'en-US': 'Ladybug',
			'es-ES': 'Mariquita',
		},
		symbol: {
			'pt-BR': 'Criação',
			'en-US': 'Creation',
			'es-ES': 'Creación',
		},
		kwami: 'Tikki',
		holder: 'Marinette Dupain-Cheng',
		image: 'https://i.ibb.co/jk7sRrrp/image.png',
	},
	{
		id: 2,
		name: {
			'pt-BR': 'Gato preto',
			'en-US': 'Black Cat',
			'es-ES': 'Gato Negro',
		},
		symbol: {
			'pt-BR': 'Destruição',
			'en-US': 'Destruction',
			'es-ES': 'Destrucción',
		},
		kwami: 'Plagg',
		holder: 'Adrien Agreste',
		image: 'https://i.ibb.co/qYcnGdsM/image.png',
	},
	{
		id: 3,
		name: {
			'pt-BR': 'Borboleta',
			'en-US': 'Butterfly',
			'es-ES': 'Mariposa',
		},
		symbol: {
			'pt-BR': 'Transmissão',
			'en-US': 'Transmission',
			'es-ES': 'Transmisión',
		},
		kwami: 'Nooroo',
		holder: 'Cerise Bianca / Lila',
		image: 'https://i.ibb.co/HDYhrsBZ/image.png',
	},
	{
		id: 4,
		name: {
			'pt-BR': 'Tartaruga',
			'en-US': 'Turtle',
			'es-ES': 'Tortuga',
		},
		symbol: {
			'pt-BR': 'Proteção',
			'en-US': 'Protection',
			'es-ES': 'Protección',
		},
		kwami: 'Wayzz',
		holder: 'Nino Lahiffe',
		image: 'https://i.ibb.co/QFkLc02p/image.png',
	},
	{
		id: 5,
		name: {
			'pt-BR': 'Raposa',
			'en-US': 'Fox',
			'es-ES': 'Zorra',
		},
		symbol: {
			'pt-BR': 'Ilusão',
			'en-US': 'Illusion',
			'es-ES': 'Ilusión',
		},
		kwami: 'Trixx',
		holder: 'Alya Césaire',
		image: 'https://i.ibb.co/2YNggbzb/image.png',
	},
	{
		id: 6,
		name: {
			'pt-BR': 'Abelha',
			'en-US': 'Bee',
			'es-ES': 'Abeja',
		},
		symbol: {
			'pt-BR': 'Ação',
			'en-US': 'Action',
			'es-ES': 'Acción',
		},
		kwami: 'Pollen',
		holder: 'Zoé Lee',
		image: 'https://i.ibb.co/gbB96CZd/image.png',
	},
	{
		id: 7,
		name: {
			'pt-BR': 'Pavão',
			'en-US': 'Peacock',
			'es-ES': 'Pavo Real',
		},
		symbol: {
			'pt-BR': 'Emoção',
			'en-US': 'Emotion',
			'es-ES': 'Emoción',
		},
		kwami: 'Duusu',
		holder: 'Félix Fathom',
		image: 'https://i.ibb.co/tp2kqCgV/image.png',
	},
	{
		id: 8,
		name: {
			'pt-BR': 'Rato',
			'en-US': 'Mouse',
			'es-ES': 'Ratón',
		},
		symbol: {
			'pt-BR': 'Multiplicação',
			'en-US': 'Multiplication',
			'es-ES': 'Multiplicación',
		},
		kwami: 'Mullo',
		holder: 'Mylène Haprèle',
		image: 'https://i.ibb.co/tTB7CxzJ/image.png',
	},
	{
		id: 9,
		name: {
			'pt-BR': 'Boi',
			'en-US': 'Ox',
			'es-ES': 'Buey',
		},
		symbol: {
			'pt-BR': 'Determinação',
			'en-US': 'Determination',
			'es-ES': 'Determinación',
		},
		kwami: 'Stompp',
		holder: 'Ivan Bruel',
		image: 'https://i.ibb.co/N2sgBMv7/image.png',
	},
	{
		id: 10,
		name: {
			'pt-BR': 'Tigre',
			'en-US': 'Tiger',
			'es-ES': 'Tigre',
		},
		symbol: {
			'pt-BR': 'Potência',
			'en-US': 'Power',
			'es-ES': 'Potencia',
		},
		kwami: 'Roaar',
		holder: 'Juleika Couffaine',
		image: 'https://i.ibb.co/nN5k8zkQ/image.png',
	},
	{
		id: 11,
		name: {
			'pt-BR': 'Coelho',
			'en-US': 'Rabbit',
			'es-ES': 'Conejo',
		},
		symbol: {
			'pt-BR': 'Evolução',
			'en-US': 'Evolution',
			'es-ES': 'Evolución',
		},
		kwami: 'Fluff',
		holder: 'Alix Kubdel',
		image: 'https://i.ibb.co/Y7BDB4Kd/image.png',
	},
	{
		id: 12,
		name: {
			'pt-BR': 'Dragão',
			'en-US': 'Dragon',
			'es-ES': 'Dragón',
		},
		symbol: {
			'pt-BR': 'Perfeição',
			'en-US': 'Perfection',
			'es-ES': 'Perfección',
		},
		kwami: 'Longg',
		holder: 'Kyoko Tsurugi',
		image: 'https://i.ibb.co/QF80LDxx/image.png',
	},
	{
		id: 13,
		name: {
			'pt-BR': 'Cobra',
			'en-US': 'Snake',
			'es-ES': 'Serpiente',
		},
		symbol: {
			'pt-BR': 'Intuição',
			'en-US': 'Intuition',
			'es-ES': 'Intuición',
		},
		kwami: 'Sass',
		holder: 'Luka Couffaine',
		image: 'https://i.ibb.co/0Rsw0wfh/image.png',
	},
	{
		id: 14,
		name: {
			'pt-BR': 'Cavalo',
			'en-US': 'Horse',
			'es-ES': 'Caballo',
		},
		symbol: {
			'pt-BR': 'Migração',
			'en-US': 'Migration',
			'es-ES': 'Migración',
		},
		kwami: 'Kaalki',
		holder: 'Max Kanté',
		image: 'https://i.ibb.co/MyJZ7ZfQ/image.png',
	},
	{
		id: 15,
		name: {
			'pt-BR': 'Cabra',
			'en-US': 'Goat',
			'es-ES': 'Cabra',
		},
		symbol: {
			'pt-BR': 'Paixão',
			'en-US': 'Passion',
			'es-ES': 'Pasión',
		},
		kwami: 'Ziggy',
		holder: 'Nathaniel Kurtzberg',
		image: 'https://i.ibb.co/cSjhnNr4/image.png',
	},
	{
		id: 16,
		name: {
			'pt-BR': 'Macaco',
			'en-US': 'Monkey',
			'es-ES': 'Mono',
		},
		symbol: {
			'pt-BR': 'Zombaria',
			'en-US': 'Mockery',
			'es-ES': 'Burla',
		},
		kwami: 'Tuppu',
		holder: 'Kim Chiến Lê-Ature',
		image: 'https://i.ibb.co/b5QynVZZ/image.png',
	},
	{
		id: 17,
		name: {
			'pt-BR': 'Galo',
			'en-US': 'Rooster',
			'es-ES': 'Gallo',
		},
		symbol: {
			'pt-BR': 'Pretensão',
			'en-US': 'Pretension',
			'es-ES': 'Pretensión',
		},
		kwami: 'Orikko',
		holder: 'Marc Anciel',
		image: 'https://i.ibb.co/My4R9gXL/image.png',
	},
	{
		id: 18,
		name: {
			'pt-BR': 'Cachorro',
			'en-US': 'Dog',
			'es-ES': 'Perro',
		},
		symbol: {
			'pt-BR': 'Adoração',
			'en-US': 'Adoration',
			'es-ES': 'Adoración',
		},
		kwami: 'Barkk',
		holder: 'Sabrina Raincomprix',
		image: 'https://i.ibb.co/RTW4p0xY/image.png',
	},
	{
		id: 19,
		name: {
			'pt-BR': 'Porco',
			'en-US': 'Pig',
			'es-ES': 'Cerdo',
		},
		symbol: {
			'pt-BR': 'Júbilo',
			'en-US': 'Jubilation',
			'es-ES': 'Júbilo',
		},
		kwami: 'Daizzi',
		holder: 'Rose Lavillant',
		image: 'https://i.ibb.co/PHPVsn2/image.png',
	},
];

const miraculousColors: Record<number, string> = {
	1: '#FF2D55', // Joaninha
	2: '#111111', // Gato Preto
	3: '#7A2CFF', // Borboleta
	4: '#2ECC71', // Tartaruga
	5: '#FF8C42', // Raposa
	6: '#FFD60A', // Abelha
	7: '#9932CC', // Pavão
	8: '#B0B0B0', // Rato
	9: '#1E2B65', // Boi
	10: '#B967B7', // Tigre
	11: '#3B82F6', // Coelho
	12: '#9C2F44', // Dragão
	13: '#2F8F8F', // Cobra
	14: '#00a8e8', // Cavalo
	15: '#7F8C8D', // Cabra
	16: '#F59E0B', // Macaco
	17: '#FF4D4D', // Galo
	18: '#c4a484', // Cachorro
	19: '#FF66C4', // Porco
};

const WhichSubCommand = createSubCommand({
	name: 'which',

	name_localizations: {
		'pt-BR': 'qual',
		'es-ES': 'cual',
	},

	description: 'Discover which Miraculous you would receive!',

	description_localizations: {
		'pt-BR': 'Descubra qual Miraculous você receberia!',
		'es-ES': '¡Descubre qué Miraculous recibirías!',
	},
	run: async ({ res, interaction }) => {
		const random = miraculous[Math.floor(Math.random() * miraculous.length)];
		const color = miraculousColors[random.id];

		const title = replyLang(interaction.locale, 'miraculous#title', {
			miraculousName:
				random.name[interaction.locale as keyof typeof random.name] ||
				random.name['en-US'],
		});

		const symbolLabel = replyLang(interaction.locale, 'miraculous#symbol');
		const kwamiLabel = replyLang(interaction.locale, 'miraculous#kwami');
		const holderLabel = replyLang(interaction.locale, 'miraculous#holder');

		const contentC = `${title}

> ### ${symbolLabel}: ${random.symbol[interaction.locale as keyof typeof random.symbol] || random.symbol['en-US']}

🐦 **${kwamiLabel}:**
${random.kwami}

👤 **${holderLabel}:**
${random.holder}
`;

		const container = createContainer(color, [
			createSection({
				content: contentC,
				thumbnail: random.image,
			}),
		]);

		res.v2([container]);
	},
});

export { WhichSubCommand };
