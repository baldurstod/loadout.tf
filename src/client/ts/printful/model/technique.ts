import { JSONObject } from 'harmony-types';

export class Technique {
	key = '';
	displayName = '';
	isDefault?: boolean = false;

	fromJSON(j: JSONObject): void {
		this.key = j.key as string;
		this.displayName = j.display_name as string;
		this.isDefault = j.is_default as boolean ?? false;
	}
}
