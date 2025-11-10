import { JSONObject } from 'harmony-types';

export class LayerOptionPrices {
	name: string = '';
	type: string = '';
	values: Array<any> = [];
	description: string = '';
	price: { [key: string]: string } = {};

	fromJSON(j: JSONObject) {
		this.name = j.name as string;
		this.type = j.type as string;
		this.description = j.description as string;
		this.values = j.values as Array<any>;
		this.price = j.price as { [key: string]: string };
	}
}

export class FileOptionPrices extends LayerOptionPrices {
}
