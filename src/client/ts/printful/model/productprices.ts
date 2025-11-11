import { JSONObject } from 'harmony-types';
import { AdditionalPlacements } from './additionalplacements';
import { VariantsPriceData } from './variantprices';

export class ProductPrices {
	currency = '';
	product = new ProductPriceInfo();
	variants = new Map<number, VariantsPriceData>();

	fromJSON(j: JSONObject): void {
		this.currency = j.currency as string;
		this.product.fromJSON(j.product as JSONObject);

		this.variants.clear();
		if (j.variants) {
			for (const variant of j.variants as JSONObject[]) {
				const v = new VariantsPriceData();
				v.fromJSON(variant);
				this.variants.set(v.id, v);
			}
		}
	}

	getPlacementPrice(technique: string, placement: string): AdditionalPlacements | null {
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
	id = 0;
	placements: AdditionalPlacements[] = [];

	getPlacementPrice(technique: string, placement: string): AdditionalPlacements | null {
		for (const p of this.placements) {
			if (p.techniqueKey == technique && p.id == placement) {
				return p;
			}
		}
		return null;
	}


	fromJSON(j: JSONObject): void {
		this.id = j.id as number;

		this.placements = [];
		if (j.placements) {
			for (const placement of j.placements as JSONObject[]) {
				const l = new AdditionalPlacements();
				l.fromJSON(placement);
				this.placements.push(l);
			}
		}
	}
}
