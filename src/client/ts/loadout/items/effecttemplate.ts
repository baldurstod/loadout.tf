import { JSONObject } from 'harmony-types';

export class EffectTemplate {
	#definition: JSONObject/*TODO: improve type*/;

	constructor(definition: JSONObject/*TODO: improve type*/) {
		this.#definition = definition;
	}
}
