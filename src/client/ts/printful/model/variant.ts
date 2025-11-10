//import { JSONObject } from 'harmony-types';
import { JSONObject } from 'harmony-types';

export class Availability {
	region: string = '';
	status: string = '';

	fromJSON(j: JSONObject) {
		this.region = j.region as string;
		this.status = j.status as string;
	}
}

export class Variant {
	id: number = 0;
	name: string = '';
	catalogProductID: number = 0;
	color: string = '';
	colorCode: string = '';
	colorCode2: string = '';
	image: string = '';
	size: string = '';
	availability: Array<Availability> = [];

	fromJSON(j: JSONObject) {
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
			for (const availability of j.availability as Array<JSONObject>) {
				const a = new Availability();
				a.fromJSON(availability);
				this.availability.push(a);
			}
		}
	}
}
