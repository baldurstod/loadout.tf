import { JSONObject } from 'harmony-types';
import { Orientation, Positioning } from './enums';

export class MockupTemplate {
	catalogVariantIds: Array<number> = [];
	placement = '';
	technique = '';
	imageURL = '';
	backgroundURL = '';
	backgroundColor = '';
	printfileId = -1;
	templateWidth = 0;
	templateHeight = 0;
	printAreaWidth = 0;
	printAreaHeight = 0;
	printAreaTop = 0;
	printAreaLeft = 0;
	templatePositioning = Positioning.Background;
	orientation = Orientation.Any;

	fromJSON(json: JSONObject) {
		this.catalogVariantIds = Array.from(json.catalog_variant_ids as Array<number> ?? []);
		this.placement = json.placement as string ?? '';
		this.technique = json.technique as string ?? '';
		this.imageURL = json.image_url as string ?? '';
		this.backgroundURL = json.background_url as string ?? '';
		this.backgroundColor = json.background_color as string ?? '';
		this.printfileId = json.printfile_id as number ?? -1;
		this.templateWidth = json.template_width as number ?? 0;
		this.templateHeight = json.template_height as number ?? 0;
		this.printAreaWidth = json.print_area_width as number ?? 0;
		this.printAreaHeight = json.print_area_height as number ?? 0;
		this.printAreaTop = json.print_area_top as number ?? 0;
		this.printAreaLeft = json.print_area_left as number ?? 0;
		this.templatePositioning = json.template_positioning as Positioning ?? Positioning.Background;
		this.orientation = json.orientation as Orientation ?? Orientation.Any;
	}

	includesId(variantId: number): boolean {
		return this.catalogVariantIds.indexOf(variantId) != -1
	}
}
