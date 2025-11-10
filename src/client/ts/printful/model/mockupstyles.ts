import { JSONObject } from 'harmony-types';
import { PrintAreaType } from './enums';
import { MockupStyle } from './mockupstyle';

export class MockupStyles {
	placement = '';
	displayName = '';
	technique = '';
	printAreaWidth = 0;
	printAreaHeight = 0;
	printAreaType = PrintAreaType.Simple;
	dpi = 300;
	styles: Array<MockupStyle> = [];

	fromJSON(json: JSONObject) {
		this.placement = json.placement as string ?? '';
		this.displayName = json.display_name as string ?? '';
		this.technique = json.technique as string ?? '';
		this.printAreaWidth = json.print_area_width as number ?? 0;
		this.printAreaHeight = json.print_area_height as number ?? 0;
		this.printAreaType = json.print_area_type as PrintAreaType ?? PrintAreaType.Simple;
		this.dpi = json.dpi as number ?? 300;
		this.styles = [];

		if (Array.isArray(json.mockup_styles)) {
			for (const j2 of json.mockup_styles) {
				const style = new MockupStyle();
				style.fromJSON(j2 as JSONObject);
				this.styles.push(style)
			}
		}
	}

	getStyles(options: { variantId?: number, technique?: string, placement?: string } = {}): Array<MockupStyle> {
		const styles: Array<MockupStyle> = [];

		for (const style of this.styles) {
			if (options.variantId !== undefined && !style.includesId(options.variantId)) {
				continue;
			}
			styles.push(style);
		}

		return styles;
	}

	includesId(variantId: number): boolean {
		for (const style of this.styles) {
			if (style.includesId(variantId)) {
				return true
			}
		}

		return false;
	}
}
