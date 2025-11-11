import { JSONObject } from 'harmony-types';
import { ProductColor } from './color';
import { Techniques } from './enums';
import { ProductPlacement } from './productplacement';
import { Technique } from './technique';

export class Product {
	id = 0;
	mainCategoryId = 0;
	type = '';
	name = '';
	brand = '';
	model = '';
	image = '';
	variantCount = 0;
	catalogVariantIds: number[] = [];
	isDiscontinued = false;
	description = '';
	sizes: string[] = [];
	colors: ProductColor[] = [];
	#techniques: Technique[] = [];
	placements: ProductPlacement[] = [];
	productOptions: any[] = [];

	getTechniques(): Technique[] {
		const techniques: Technique[] = [];

		for (const technique of this.#techniques) {
			if (technique.key as Techniques != Techniques.Embroidery) {
				techniques.push(technique);
			}
		}

		return techniques;
	}

	getPlacements(technique?: string): ProductPlacement[] {
		const placements: ProductPlacement[] = [];
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

	fromJSON(j: JSONObject): void {
		this.id = j.id as number;
		this.mainCategoryId = j.main_category_id as number;
		this.type = j.type as string;
		this.name = j.name as string;
		this.brand = j.brand as string;
		this.model = j.model as string;
		this.image = j.image as string;
		this.variantCount = j.variant_count as number;
		this.catalogVariantIds = j.catalog_variant_ids as number[];
		this.isDiscontinued = j.is_discontinued as boolean ?? false;
		this.description = j.description as string;
		this.sizes = j.sizes as string[];

		this.colors = [];
		for (const color of j.colors as JSONObject[]) {
			//layers.push(item.toJSON());
			const c = new ProductColor();
			c.fromJSON(color);
			this.colors.push(c);
		}

		this.#techniques = [];
		for (const technique of j.techniques as JSONObject[]) {
			//layers.push(item.toJSON());
			const t = new Technique();
			t.fromJSON(technique);
			this.#techniques.push(t);
		}

		this.placements = [];
		for (const placement of j.placements as JSONObject[]) {
			const t = new ProductPlacement();
			t.fromJSON(placement);
			this.placements.push(t);
		}

		this.productOptions = [];
		for (const option of j.product_options as JSONObject[]) {
			this.productOptions.push(option);
		}
	}
}
