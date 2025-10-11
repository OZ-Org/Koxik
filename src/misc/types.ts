// Tipos de IDs para picaretas
export type PickaxesTypesIDs =
	| 'PICX_WOODEN'
	| 'PICX_STONE'
	| 'PICX_IRON'
	| 'PICX_DIAMOND'
	| 'PICX_NETHERITE';

// Tipos de minérios disponíveis
export type OreType =
	| 'stone'
	| 'coal'
	| 'iron'
	| 'diamond'
	| 'netherite'
	| 'wood';

// Item da mochila (pode ser uma picareta ou um minério)
export type BackpackItem =
	| {
			id: PickaxesTypesIDs;
			type: 'pickaxe';
			durability: number; // sempre definido em picaretas
			name: string;
			ores: OreType[]; // minérios que essa picareta pode minerar
			rates: Record<OreType, number>; // % de chance para cada minério
	  }
	| {
			id: string; // Ex: "stone_123456"
			type: 'ore';
			name: OreType;
			amount: number; // quantidade, limitado a 64 por stack
	  };

export interface Transaction {
	id: string;
	type:
		| 'daily'
		| 'pay_sent'
		| 'pay_received'
		| 'deposit'
		| 'withdraw'
		| 'mine_created';
	amount: number;
	timestamp: number;
	description?: string;
	from?: string;
	to?: string;
}
// A mochila é apenas um array de itens
export type BackpackType = BackpackItem[];
