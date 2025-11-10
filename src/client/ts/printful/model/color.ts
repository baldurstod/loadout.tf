import { Color } from 'harmony-utils';
import { JSONObject } from 'harmony-types';

export class ProductColor {
	name: string = '';
	value: string = '';

	fromJSON(j: JSONObject) {
		this.name = j.name as string;
		this.value = j.value as string;
	}

	getLuminance(): number {
		const c = new  Color()
		c.setHex(this.value);
		return c.getLuminance();
	}
}
