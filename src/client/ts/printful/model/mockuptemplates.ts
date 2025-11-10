import { JSONObject } from 'harmony-types';
import { MockupTemplate } from './mockuptemplate';

export class MockupTemplates {
	productId: number = -1;
	templates: Array<MockupTemplate> = [];

	constructor(productId: number) {
		this.productId = productId;
	}

	fromJSON(json: JSONObject) {
		//this.productId = json.product_id as number ?? -1;
		this.templates = [];

		if (!Array.isArray(json)) {
			return;
		}


		for (const j2 of json) {
			const template = new MockupTemplate();
			template.fromJSON(j2 as JSONObject);
			this.templates.push(template)
		}
	}

	getTemplates(options: { variantId?: number, technique?: string, placement?: string } = {}): Array<MockupTemplate> {
		const templates: Array<MockupTemplate> = [];

		for (const template of this.templates) {
			if (options.variantId !== undefined && !template.includesId(options.variantId)) {
				continue;
			}
			if (options.technique !== undefined && template.technique != options.technique) {
				continue;
			}
			if (options.placement !== undefined && template.placement != options.placement) {
				continue;
			}

			templates.push(template);
		}

		return templates;
	}
}
