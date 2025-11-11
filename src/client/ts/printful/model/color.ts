import { JSONObject } from 'harmony-types';
import { Color } from 'harmony-utils';

export class ProductColor {
	name = '';
	value = '';

	fromJSON(j: JSONObject): void {
		this.name = j.name as string;
		this.value = j.value as string;
	}

	getLuminance(): number {
		const c = new Color()
		c.setHex(this.value);
		return c.getLuminance();
	}
}
