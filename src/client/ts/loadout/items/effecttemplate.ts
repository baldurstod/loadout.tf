import { JSONObject } from 'harmony-types';
import { CharactersList, Tf2Class } from '../characters/characters';

export class EffectTemplate {
	#definition: JSONObject/*TODO: improve type*/;

	constructor(definition: JSONObject/*TODO: improve type*/) {
		this.#definition = definition;
	}
}
