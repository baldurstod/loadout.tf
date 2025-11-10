import { JSONObject } from 'harmony-types';
import { MockupStyles } from './mockupstyles';
import { MockupTemplate } from './mockuptemplate';

export class ProductMockupStyles {
	productId: number = -1;
	styles: Array<MockupStyles> = [];

	constructor(productId: number) {
		this.productId = productId;
	}

	fromJSON(json: JSONObject) {
		this.styles = [];

		if (!Array.isArray(json)) {
			return;
		}

		for (const j2 of json) {
			const styles = new MockupStyles();
			styles.fromJSON(j2 as JSONObject);
			this.styles.push(styles)
		}
	}
	/*
		includesId(variantId: number): boolean {
			const styles: Array<MockupStyles> = [];

			for (const style of this.styles) {
				if (style.includesId(variantId)) {
					continue;
				}
				templates.push(template);
			}

			return styles;
		}
		*/

	getStyles(options: { variantId?: number, technique?: string, placement?: string } = {}): Array<MockupStyles> {
		const styles: Array<MockupStyles> = [];

		for (const style of this.styles) {
			if (options.variantId !== undefined && !style.includesId(options.variantId)) {
				continue;
			}
			if (options.placement !== undefined && style.placement != options.placement) {
				continue;
			}
			if (options.technique !== undefined && style.technique != options.technique) {
				continue;
			}
			styles.push(style);
		}

		return styles;
	}
}
