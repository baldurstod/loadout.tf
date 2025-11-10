import { JSONObject } from 'harmony-types';

export class Technique {
	key: string = '';
	displayName: string = '';
	isDefault?: boolean = false;

	fromJSON(j: JSONObject) {
		this.key = j.key as string;
		this.displayName = j.display_name as string;
		this.isDefault = j.is_default as boolean ?? false;
	}
}
