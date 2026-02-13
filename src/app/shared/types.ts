export type BadgeID =
	| 'developer'
	| 'bot'
	| 'small_dev'
	| 'booster'
	| 'owner'
	| 'partner'
	| 'staff'
	| 'beta';

export type PickaxesTypesIDs =
	| 'PICX_WOODEN'
	| 'PICX_STONE'
	| 'PICX_IRON'
	| 'PICX_DIAMOND'
	| 'PICX_NETHERITE';

export type OreType =
	| 'stone'
	| 'coal'
	| 'iron'
	| 'diamond'
	| 'netherite'
	| 'wood';

export type BackpackItem =
	| {
			id: string;
			type: 'pickaxe';
			durability: number;
			name: string;
			starter: boolean;
			ores: OreType[];
			maked: PickaxesTypesIDs;
			rates: Record<OreType, number>;
	  }
	| {
			id: string;
			type: 'ore';
			name: OreType;
			amount: number;
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

export interface UserData {
	balance: number;
	bank: number;
	transactions: Transaction[];
}

export interface PaymentResult {
	sent: number;
	fee: number;
	robbed: boolean;
	stolen: number;
	received: number;
	method: 'balance' | 'bank';
}

export interface DailyResult {
	balance: number;
	bonus: number;
	streakDays: number;
}

export type BackpackType = BackpackItem[];
