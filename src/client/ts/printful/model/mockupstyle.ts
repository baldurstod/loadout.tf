import { JSONObject } from 'harmony-types';

export class MockupStyle {
	id = -1;
	categoryName = '';
	viewName = '';
	restrictedToVariants: Array<number> = [];

	fromJSON(json: JSONObject) {
		this.id = json.id as number ?? -1;
		this.categoryName = json.category_name as string ?? '';
		this.viewName = json.view_name as string ?? '';

		this.restrictedToVariants = [];
		if (Array.isArray(json.restricted_to_variants)) {
			for (const j2 of json.restricted_to_variants) {
				this.restrictedToVariants.push(j2 as number)
			}
		}
	}

	includesId(variantId: number): boolean {
		if (this.restrictedToVariants.length == 0) {
			return true;
		}
		return this.restrictedToVariants.indexOf(variantId) != -1
	}
}

/*
type MockupStyle struct {
	Id                   int    `json:'id' bson:'id'`
	CategoryName         string `json:'category_name' bson:'category_name'`
	ViewName             string `json:'view_name' bson:'view_name'`
	RestrictedToVariants []int  `json:'restricted_to_variants' bson:'restricted_to_variants'`
}
*/
