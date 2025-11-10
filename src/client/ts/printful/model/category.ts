import { JSONObject, JSONValue } from 'harmony-types';

export class Category {
	id: number = 0;
	parentId: number = 0;
	imageURL: string = '';
	title: string = '';

	fromJSON(j: JSONObject) {
		this.id = j.id as number;
		this.parentId = j.parent_id as number;
		this.imageURL = j.image_url as string;
		this.title = j.title as string;
	}
}
