//import { JSONObject } from 'harmony-types';
import { JSONObject } from 'harmony-types';

export class Availability {
	region = '';
	status = '';

	fromJSON(j: JSONObject): void {
		this.region = j.region as string;
		this.status = j.status as string;
	}
}

export class Variant {
	id = 0;
	name = '';
	catalogProductID = 0;
	color = '';
	colorCode = '';
	colorCode2 = '';
	image = '';
	size = '';
	availability: Availability[] = [];

	fromJSON(j: JSONObject): void {
		this.id = j.id as number;
		this.name = j.name as string;
		this.catalogProductID = j.catalog_product_id as number;
		this.color = j.color as string;
		this.colorCode = j.color_code as string;
		this.colorCode2 = j.color_code2 as string;
		this.image = j.image as string;
		this.size = j.size as string;

		this.availability = [];

		if (j.availability) {
			for (const availability of j.availability as JSONObject[]) {
				const a = new Availability();
				a.fromJSON(availability);
				this.availability.push(a);
			}
		}
	}
}
