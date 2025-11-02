import { vec3 } from 'gl-matrix';
import { JSONArray, JSONObject } from 'harmony-types';

export class PresetItem {
	id = '';
	paint?: number;
	paintkitId?: number;
	paintkitWear?: number;
	paintkitSeed?: bigint;
	isTournamentMedal = false;
	isWorkshop = false;
	weaponEffect?: number;
	sheen?: number;
	showFestivizer = false;
	killCount? = 0;

	fromJSON(json: JSONObject): boolean {
		if (json.id !== undefined) {
			this.id = json.id as string;
		}
		if (json.paint !== undefined) {
			this.paint = json.paint as number;
		}
		if (json.paintkit_id !== undefined) {
			this.paintkitId = json.paintkit_id as number;
		}
		if (json.paintkit_wear !== undefined) {
			this.paintkitWear = json.paintkit_wear as number;
		}
		if (json.paintkit_seed !== undefined) {
			this.paintkitSeed = BigInt(json.paintkit_seed as string);
		}
		if (json.weapon_effect !== undefined) {
			this.weaponEffect = json.weapon_effect as number;
		}
		if (json.sheen !== undefined) {
			this.sheen = json.sheen as number;
		}
		if (json.kill_count !== undefined) {
			this.killCount = json.kill_count as number;
		}
		this.showFestivizer = (json.show_festivizer as boolean) ?? false;
		this.isTournamentMedal = json.is_tournament_medal as boolean ?? false;
		this.isWorkshop = json.is_workshop as boolean ?? false;
		return true;
	}

	toJSON(): JSONObject/*TODO: improve type*/ {
		const j: JSONObject = {};

		j.id = this.id;
		if (this.paint !== undefined) {
			j.paint = this.paint;
		}
		if (this.paintkitId !== undefined) {
			j.paintkit_id = this.paintkitId;
		}
		if (this.paintkitWear !== undefined) {
			j.paintkit_wear = this.paintkitWear;
		}
		if (this.paintkitSeed !== undefined) {
			j.paintkit_seed = String(this.paintkitSeed);
		}
		if (this.weaponEffect !== undefined) {
			j.weapon_effect = this.weaponEffect;
		}
		if (this.sheen !== undefined) {
			j.sheen = this.sheen;
		}
		if (this.showFestivizer !== false) {
			j.show_festivizer = this.showFestivizer;
		}
		j.kill_count = this.killCount || undefined;
		if (this.isTournamentMedal != false) {
			j.is_tournament_medal = this.isTournamentMedal;
		}
		if (this.isWorkshop != false) {
			j.is_workshop = this.isWorkshop;
		}

		return j;
	}
}

export enum PresetEffectType {
	Unusual = "unusual",
	Taunt = "taunt",
	Killstreak = "killstreak",
}

export class PresetEffect {
	name = '';
	attachment = '';
	offset = vec3.create();
	color = vec3.create();
	isEyeGlow = false;
	type: PresetEffectType = PresetEffectType.Unusual;

	fromJSON(json: JSONObject): boolean {
		if (json.name !== undefined) {
			this.name = json.name as string;
		}
		if (json.attachment !== undefined) {
			this.attachment = json.attachment as string;
		}
		if (json.type !== undefined) {
			this.type = json.type as PresetEffectType;
		}
		if (json.is_eye_glow !== undefined) {
			this.isEyeGlow = json.is_eye_glow as boolean;
		}
		if (json.offset !== undefined) {
			vec3.copy(this.offset, json.offset as any);
		}
		if (json.color !== undefined) {
			vec3.copy(this.color, json.color as any);
		}
		return true;
	}

	toJSON(): JSONObject {
		return {
			name: this.name,
			attachment: this.attachment,
			type: this.type,
			is_eye_glow: this.isEyeGlow,
			offset: this.offset as any,
			color: this.color as any,
		};
	}
}

export class Preset {
	character = '';
	name = '';
	items = new Set<PresetItem>();
	effects = new Set<PresetEffect>();
	decapitationLevel = 0;

	constructor(name?: string) {
		if (name !== undefined) {
			this.name = name;
		}
	}

	addItem(item: PresetItem): void {
		this.items.add(item);
	}

	addEffect(effect: PresetEffect): void {
		this.effects.add(effect);
	}

	fromJSON(json: JSONObject): boolean {
		if (json.name !== undefined) {
			this.name = json.name as string;
		}
		if (json.character !== undefined) {
			this.character = json.character as string;
		}
		if (json.items !== undefined) {
			//this.name = json.name as string;
			for (const itemJson of json.items as JSONArray) {
				const presetItem = new PresetItem();

				if (presetItem.fromJSON(itemJson as JSONObject)) {
					this.addItem(presetItem);
				}
			}

			for (const effectJson of json.effects as JSONArray) {
				const presetEffect = new PresetEffect();

				if (presetEffect.fromJSON(effectJson as JSONObject)) {
					this.addEffect(presetEffect);
				}
			}
		}
		if (json.decapitation_level !== undefined) {
			this.decapitationLevel = json.decapitation_level as number;
		}
		return true;
	}

	toJSON(): JSONObject {
		const j: { name: string, character: string, items: JSONObject[], effects: JSONObject[], decapitation_level?: number } = {
			name: this.name,
			character: this.character,
			items: [],
			effects: [],
		};

		for (const item of this.items) {
			j.items.push(item.toJSON());
		}

		for (const effect of this.effects) {
			j.effects.push(effect.toJSON());
		}

		if (this.decapitationLevel != 0) {
			j.decapitation_level = this.decapitationLevel;
		}

		return j;
	}
}

export class Presets {
	#presets = new Map<string, Preset>();
	selected?: string;

	addPreset(preset: Preset): void {
		this.#presets.set(preset.name, preset);
	}

	getPreset(name: string): Preset | undefined {
		return this.#presets.get(name);
	}

	getPresets(): Map<string, Preset> {
		return this.#presets;
	}

	removePreset(name: string): void {
		if (name == this.selected) {
			this.selected = undefined;
		}

		this.#presets.delete(name);
	}

	fromJSON(json: JSONObject): boolean {

		this.selected = json.selected as string;

		if (json.presets) {
			for (const preset of json.presets as JSONArray) {
				const p = new Preset();

				if (p.fromJSON(preset as JSONObject)) {
					this.addPreset(p);
				}
			}
		}

		return true;
	}

	toJSON(): JSONObject {
		const j: JSONObject = {};
		const presets: JSONObject[] = [];
		if (this.selected) {
			j.selected = this.selected;
		}
		j.presets = presets;

		for (const [, preset] of this.#presets) {
			presets.push(preset.toJSON());
		}

		return j;
	}
}
