import { JSONObject } from 'harmony-types';

export class Category {
	id = 0;
	parentId = 0;
	imageURL = '';
	title = '';

	fromJSON(j: JSONObject): void {
		this.id = j.id as number;
		this.parentId = j.parent_id as number;
		this.imageURL = j.image_url as string;
		this.title = j.title as string;
	}
}
