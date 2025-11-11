import { JSONObject } from 'harmony-types';
import { FileOptionPrices } from './layeroptionprices';
import { Layers } from './layers';

export class AdditionalPlacements {
	id = '';
	title = '';
	type = '';
	techniqueKey = '';
	price = '';
	placementOptions: FileOptionPrices[] = [];
	layers: Layers[] = [];

	fromJSON(j: JSONObject): void {
		this.id = j.id as string;
		this.title = j.title as string;
		this.type = j.type as string;
		this.techniqueKey = j.technique_key as string;
		this.price = j.price as string;

		this.placementOptions = [];
		if (j.placement_options) {
			for (const placementOption of j.placement_options as JSONObject[]) {
				const f = new FileOptionPrices();
				f.fromJSON(placementOption);
				this.placementOptions.push(f);
			}
		}

		this.layers = [];
		if (j.layers) {
			for (const layer of j.layers as JSONObject[]) {
				const l = new Layers();
				l.fromJSON(layer);
				this.layers.push(l);
			}
		}
	}
}
/*
type AdditionalPlacements struct {
	ID               string             `json:"id" bson:"id" mapstructure:"id"`
	Title            string             `json:"title" bson:"title" mapstructure:"title"`
	Type             string             `json:"type" bson:"type" mapstructure:"type"`
	TechniqueKey     string             `json:"technique_key" bson:"technique_key" mapstructure:"technique_key"`
	Price            string             `json:"price" bson:"price" mapstructure:"price"`
	DiscountedPrice  string             `json:"discounted_price" bson:"discounted_price" mapstructure:"discounted_price"`
	PlacementOptions []FileOptionPrices `json:"placement_options" bson:"placement_options" mapstructure:"placement_options"`
	Layers           []Layers           `json:"layers" bson:"layers" mapstructure:"layers"`
}
*/
