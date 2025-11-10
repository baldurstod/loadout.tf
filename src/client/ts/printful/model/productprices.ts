import { JSONObject } from 'harmony-types';
import { AdditionalPlacements } from './additionalplacements';
import { VariantsPriceData } from './variantprices';

export class ProductPrices {
	currency: string = '';
	product = new ProductPriceInfo();
	variants = new Map<number, VariantsPriceData>();

	fromJSON(j: JSONObject) {
		this.currency = j.currency as string;
		this.product.fromJSON(j.product as JSONObject);

		this.variants.clear();
		if (j.variants) {
			for (const variant of j.variants as Array<JSONObject>) {
				const v = new VariantsPriceData();
				v.fromJSON(variant);
				this.variants.set(v.id, v);
			}
		}
	}

	getPlacementPrice(technique: string, placement: string) {
		return this.product.getPlacementPrice(technique, placement);
	}
}


/*

type ProductPrices struct {
	Currency string              `json:"currency" bson:"currency" mapstructure:"currency"`
	Product  ProductPriceInfo    `json:"product" bson:"product" mapstructure:"product"`
	Variants []VariantsPriceData `json:"variants" bson:"variants" mapstructure:"variants"`
}

*/

export class ProductPriceInfo {
	id: number = 0;
	placements: Array<AdditionalPlacements> = [];

	getPlacementPrice(technique: string, placement: string) {
		for (const p of this.placements) {
			if (p.techniqueKey == technique && p.id == placement) {
				return p;
			}
		}
	}


	fromJSON(j: JSONObject) {
		this.id = j.id as number;

		this.placements = [];
		if (j.placements) {
			for (const placement of j.placements as Array<JSONObject>) {
				const l = new AdditionalPlacements();
				l.fromJSON(placement);
				this.placements.push(l);
			}
		}
	}
}
