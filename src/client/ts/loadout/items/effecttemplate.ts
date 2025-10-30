import { JSONObject } from 'harmony-types';

export enum EffectType {
	Cosmetic = 'cosmetic_unusual_effects',
	Killstreak = 'killstreak_eyeglows',
	Taunt = 'taunt_unusual_effects',
	Weapon = 'weapon_unusual_effects',
	Other = 'other_particles',
}
export class EffectTemplate {
	#type: EffectType;
	#definition: JSONObject;

	constructor(type:EffectType, definition: JSONObject) {
		this.#type = type;
		this.#definition = definition;
	}

	getType(): EffectType {
		return this.#type;
	}

	getName(): string {
		return this.#definition.name as string;
	}

	getSystem(): string {
		return this.#definition.system as string;
	}

	isTeamColored(): boolean {
		const system = this.getSystem();
		return system.includes('_teamcolor_red') || system.includes('_teamcolor_blue');
	}
}
