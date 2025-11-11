import { JSONObject } from 'harmony-types';

export class LayerOptionPrices {
	name = '';
	type = '';
	values: any[] = [];
	description = '';
	price: Record<string, string> = {};

	fromJSON(j: JSONObject): void {
		this.name = j.name as string;
		this.type = j.type as string;
		this.description = j.description as string;
		this.values = j.values as any[];
		this.price = j.price as Record<string, string>;
	}
}

export class FileOptionPrices extends LayerOptionPrices {
}
