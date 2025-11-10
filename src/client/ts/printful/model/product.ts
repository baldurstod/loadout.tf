import { JSONObject } from 'harmony-types';
import { ProductColor } from './color';
import { Techniques } from './enums';
import { ProductPlacement } from './productplacement';
import { Technique } from './technique';

export class Product {
	id: number = 0;
	mainCategoryId: number = 0;
	type: string = '';
	name: string = '';
	brand: string = '';
	model: string = '';
	image: string = '';
	variantCount: number = 0;
	catalogVariantIds: Array<number> = [];
	isDiscontinued: boolean = false;
	description: string = '';
	sizes: Array<string> = [];
	colors: Array<ProductColor> = [];
	#techniques: Array<Technique> = [];
	placements: Array<ProductPlacement> = [];
	productOptions: Array<any/*TODO: create type CatalogOption*/> = [];

	getTechniques(): Array<Technique> {
		const techniques: Array<Technique> = [];

		for (const technique of this.#techniques) {
			if (technique.key != Techniques.Embroidery) {
				techniques.push(technique);
			}
		}

		return techniques;
	}

	getPlacements(technique?: string): Array<ProductPlacement> {
		const placements: Array<ProductPlacement> = [];
		for (const placement of this.placements) {
			if (placement.getPlacement() == 'mockup') {
				continue;
			}
			if (technique === undefined || placement.getTechnique() == technique) {
				placements.push(placement);
			}
		}
		return placements;
	}

	fromJSON(j: JSONObject) {
		this.id = j.id as number;
		this.mainCategoryId = j.main_category_id as number;
		this.type = j.type as string;
		this.name = j.name as string;
		this.brand = j.brand as string;
		this.model = j.model as string;
		this.image = j.image as string;
		this.variantCount = j.variant_count as number;
		this.catalogVariantIds = j.catalog_variant_ids as Array<number>;
		this.isDiscontinued = j.is_discontinued as boolean ?? false;
		this.description = j.description as string;
		this.sizes = j.sizes as Array<string>;

		this.colors = [];
		for (const color of j.colors as Array<JSONObject>) {
			//layers.push(item.toJSON());
			const c = new ProductColor();
			c.fromJSON(color);
			this.colors.push(c);
		}

		this.#techniques = [];
		for (const technique of j.techniques as Array<JSONObject>) {
			//layers.push(item.toJSON());
			const t = new Technique();
			t.fromJSON(technique);
			this.#techniques.push(t);
		}

		this.placements = [];
		for (const placement of j.placements as Array<JSONObject>) {
			const t = new ProductPlacement();
			t.fromJSON(placement);
			this.placements.push(t);
		}

		this.productOptions = [];
		for (const option of j.product_options as Array<JSONObject>) {
			this.productOptions.push(option);
		}
	}
}
