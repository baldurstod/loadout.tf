import { JSONObject } from 'harmony-types';
import { LayerOptionPrices } from './layeroptionprices';

export class Layers {
	type = '';
	additionalPrice = '';
	options: LayerOptionPrices[] = [];

	fromJSON(j: JSONObject): void {
		this.type = j.type as string;
		this.additionalPrice = j.additional_price as string;

		this.options = [];
		if (j.layer_options) {
			for (const layer of j.layer_options as JSONObject[]) {
				const l = new LayerOptionPrices();
				l.fromJSON(layer);
				this.options.push(l);
			}
		}
	}
}
/*

	Type            string              `json:"type" bson:"type" mapstructure:"type"`
	AdditionalPrice string              `json:"additional_price" bson:"additional_price" mapstructure:"additional_price"`
	Options         []LayerOptionPrices `json:"layer_options" bson:"layer_options" mapstructure:"layer_options"`
*/
