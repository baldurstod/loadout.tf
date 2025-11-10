import { Techniques } from './model/enums';
import { MockupTemplate } from './model/mockuptemplate';
import { MockupTemplates } from './model/mockuptemplates';
import { fetchShopAPI } from './shop';

const mockupTemplates = new Map<number, MockupTemplates>();

export async function GetMockupTemplates(productId: number/*, variantId: number, placement: string, technique: Technique, orientation: Orientation*/): Promise<MockupTemplates | undefined> {
	if (!mockupTemplates.has(productId)) {
		const { response: json } = await fetchShopAPI('get-printful-mockup-templates', 1, { product_id: productId });
		if (json && json.success) {
			const templates = new MockupTemplates(productId);
			templates.fromJSON(json.result.templates);
			mockupTemplates.set(productId, templates);
		}
	}

	const templates = mockupTemplates.get(productId);
	if (!templates) {
		return;
	}

	return templates;

	//const filteredTemplates: Array<any/*TODO: create a template tye*/> = [];

	//for (const template of (templates as Array<JSONObject>)) {
	/*
	if (
		template.placement != placement ||
		template.technique != technique ||
		template.orientation != orientation
	) {
		continue;
	}
	*/

	/*
	if (template.catalog_variant_ids) {
		if (!(template.catalog_variant_ids as Array<number>).find((v: number) => v == variantId)) {
			continue;
		}
	}
	*/

	// Discard phony templates
	//if (
	//			Number(template.print_area_width) >= 0 ||
	//Number(template.print_area_height) >= 0
	//) {
	//continue;
	//}

	//filteredTemplates.push(template);
	//}

	//return filteredTemplates;
}

export async function GetMockupTemplate(productId: number, variantId: number, technique: Techniques, placement: string): Promise<MockupTemplate | undefined> {
	const mockupTemplates = await GetMockupTemplates(productId);
	if (!mockupTemplates) {
		return undefined;
	}

	const templates = mockupTemplates.getTemplates({ variantId: variantId, technique: technique, placement: placement });

	let filteredTemplates: Array<MockupTemplate> = [];


	for (const template of templates) {
		if (template.printAreaWidth > 0 && template.printAreaHeight > 0) {
			filteredTemplates.push(template);
		} else {
			//console.warn('discarding template', template);
		}
	}

	// TODO: check if array only has one element
	if (filteredTemplates.length > 1) {
		console.error('check templates', filteredTemplates);
		const filteredTemplates2: Array<MockupTemplate> = [];

		for (const template of filteredTemplates) {
			if (template.printAreaTop > 0 && template.printAreaLeft > 0) {
				filteredTemplates2.push(template);
			}
		}

		filteredTemplates = filteredTemplates2;

		if (filteredTemplates.length > 1) {
			console.error('check templates', filteredTemplates);
			const filteredTemplates2: Array<MockupTemplate> = [];
		}
	}

	return filteredTemplates[0];
}
