import { JSONObject } from 'harmony-types';

/*
export class ProductPrices {
	currency: string = '';
	product = new ProductPriceInfo();
	variants: Array<VariantsPriceData> = [];

	fromJSON(j: JSONObject) {
		this.currency = j.currency as string;
		this.product.fromJSON(j.product as JSONObject)

		this.additionalPrice = j.additional_price as string;

		this.options = [];
		if (j.layer_options) {
			for (const layer of j.layer_options as Array<JSONObject>) {
				const l = new LayerOptionPrices();
				l.fromJSON(layer);
				this.options.push(l);
			}
		}
	}
}
*/



export class VariantsPriceData {
	id = 0;
	techniques: TechniquePriceInfo[] = [];

	fromJSON(j: JSONObject): void {
		this.id = j.id as number;

		this.techniques = [];
		if (j.techniques) {
			for (const placement of j.techniques as JSONObject[]) {
				const l = new TechniquePriceInfo();
				l.fromJSON(placement);
				this.techniques.push(l);
			}
		}
	}
}

/*
type VariantsPriceData struct {
	ID         int                  `json:"id" bson:"id" mapstructure:"id"`
	Techniques []TechniquePriceInfo `json:"techniques" bson:"techniques" mapstructure:"techniques"`
}
*/

export class TechniquePriceInfo {
	price = '';
	discountedPrice = '';
	techniqueKey = '';
	displayName = '';

	fromJSON(j: JSONObject): void {
		this.price = j.price as string;
		this.discountedPrice = j.discounted_price as string;
		this.techniqueKey = j.technique_key as string;
		this.displayName = j.technique_display_name as string;
	}
}



/*


type TechniquePriceInfo struct {
	Price           string `json:"price" bson:"price" mapstructure:"price"`
	DiscountedPrice string `json:"discounted_price" bson:"discounted_price" mapstructure:"discounted_price"`
	Key             string `json:"technique_key" bson:"technique_key" mapstructure:"technique_key"`
	DisplayName     string `json:"technique_display_name" bson:"technique_display_name" mapstructure:"technique_display_name"`
}

*/
