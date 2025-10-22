import { JSONObject } from 'harmony-types';

export class ItemTemplate {
	#definition: JSONObject/*TODO: improve type*/;

	constructor(definition: JSONObject/*TODO: improve type*/) {
		this.#definition = definition;
	}

	get name() {
		return this.#definition.name as string ?? '';
	}

	getModel(npc: string): string | null {
		function convertDemo(npc: string) {
			if (npc == 'demoman') {
				return 'demo';
			} else {
				return npc;
			}
		}
		npc = npc.replace(/bot_/, '');

		let modelPlayerPerClass = this.#definition.model_player_per_class as { [key: string]: string }/*TODO: improve type*/;

		if (modelPlayerPerClass) {
			if (modelPlayerPerClass[npc]) {
				return modelPlayerPerClass[npc] ?? null;
			}

			let basename = modelPlayerPerClass['basename'];
			if (basename) {
				let usedByClasses = this.#definition.used_by_classes as { [key: string]: string }/*TODO: improve type*/;
				if (usedByClasses) {
					if (usedByClasses[npc] == "1") {
						return basename.replace(/%s/g, convertDemo(npc));
					} else {
						let arr = Object.keys(usedByClasses);
						if (arr.length > 0) {
							return basename.replace(/%s/g, convertDemo(arr[0]!));
						}
					}
				}
			}
		}

		let modelPlayer = this.#definition.model_player as string/*TODO: improve type*/;
		if (modelPlayer) {
			return modelPlayer;
		}

		let customTauntPropPerClass = this.#definition.custom_taunt_prop_per_class as { [key: string]: string }/*TODO: improve type*/;
		if (customTauntPropPerClass?.[npc]) {
			return customTauntPropPerClass[npc] ?? null;
		}

		// Look for the first model_player_per_class
		if (modelPlayerPerClass) {
			let arr = Object.keys(modelPlayerPerClass);
			if (arr.length > 0) {
				return modelPlayerPerClass[arr[0]!] ?? null;
			}
		}
		return null;
	}

	getModelBlue(npc: string) {
		let modelPlayerPerClassBlue = this.#definition.model_player_per_class_blue as { [key: string]: string }/*TODO: improve type*/;

		if (modelPlayerPerClassBlue) {
			return modelPlayerPerClassBlue[npc];
		}
	}

	get imageInventory(): string | null {
		return this.#definition.image_inventory as (string | undefined) ?? null;
	}

	get id(): string {
		return this.#definition.id as string ?? '';
	}

	get redSkin(): number {
		let skinRed = Number(this.#definition.skin_red as string);
		return isNaN(skinRed) ? 0 : skinRed;
	}

	get bluSkin(): number {
		let skinBlu = Number(this.#definition.skin_blu as string);
		return isNaN(skinBlu) ? 1 : skinBlu;
	}

	get playerBodygroups(): Record<string, string> {
		return this.#definition.player_bodygroups as Record<string, string>;
	}

	get wmBodygroupOverride(): Record<string, string> {
		return this.#definition.wm_bodygroup_override as Record<string, string>;
	}

	get usePerClassBodygroups(): string {
		return this.#definition.use_per_class_bodygroups as string;
	}

	get extraWearable(): string {
		return this.#definition.extra_wearable as string/*TODO: improve type*/;
	}

	get attachedModels(): string {
		return this.#definition.attached_models as string/*TODO: improve type*/;
	}

	get animSlot(): string {
		return this.#definition.anim_slot as string/*TODO: fix type*/;
	}

	getItemSlot(npc: string): string | null {
		let usedByClasses = this.#definition.used_by_classes as { [key: string]: string }/*TODO: improve type*/;
		if (usedByClasses) {
			let usedByClass = usedByClasses[npc];
			if (usedByClass == 'primary' || usedByClass == 'secondary') {
				return usedByClass;
			}
		}
		return this.#definition.item_slot as string ?? null;
	}

	get attachedModelsFestive(): string {
		return this.#definition.attached_models_festive as string/*TODO: improve type*/;
	}

	get weaponUsesStattrakModule(): string {
		return this.#definition.weapon_uses_stattrak_module as string/*TODO: improve type*/;
	}

	get weaponStattrakModuleScale(): string {
		return this.#definition.weapon_stattrak_module_scale as string/*TODO: improve type*/;
	}

	get particleSuffix(): string | null {
		return this.#definition.particle_suffix as string ?? null;
	}

	get repository(): string {
		return this.#definition.repository as string;
	}

	get equipRegions(): string[] {
		return this.#definition.equip_regions as string[];
	}

	get setItemTintRGB(): string {
		return this.#definition.set_item_tint_rgb as string/*TODO: improve type*/;
	}

	get setItemTintRGB2(): string | null {
		return this.#definition.set_item_tint_rgb_2 as (string | undefined) ?? this.#definition.set_item_tint_rgb as (string | undefined) ?? null;
	}

	get setAttachedParticleStatic(): string | null {
		if (this.#definition.use_smoke_particle_effect == "0") {
			return null;
		}

		return this.#definition.set_attached_particle_static as string;
	}

	get attachedParticlesystems(): Record<string, string> {
		return this.#definition.attached_particlesystems as Record<string, string>;
	}

	get customTauntScenePerClass(): Record<string, string> {
		return this.#definition.custom_taunt_scene_per_class as Record<string, string>;
	}

	get customTauntOutroScenePerClass(): Record<string, string> {
		return this.#definition.custom_taunt_outro_scene_per_class as Record<string, string>;
	}

	get customTauntPropScenePerClass(): Record<string, string> {
		return this.#definition.custom_taunt_prop_scene_per_class as Record<string, string>;
	}

	get customTauntPropOutroScenePerClass(): Record<string, string> {
		return this.#definition.custom_taunt_prop_outro_scene_per_class as Record<string, string>;
	}

	get tauntAttackName(): string {
		return this.#definition.taunt_attack_name as string /*TODO: improve type*/;
	}

	get tauntSuccessSoundLoop(): string {
		return this.#definition.taunt_success_sound_loop as string /*TODO: improve type*/;
	}

	get tauntSuccessSoundLoopOffset(): number {
		return Number(this.#definition.taunt_success_sound_loop_offset as string) /*TODO: improve type*/;;
	}

	get materialOverride(): string {
		return this.#definition.material_override as string/*TODO: improve type*/;
	}

	isWorkshop(): boolean {
		return this.#definition.is_workshop as boolean/*TODO: improve type*/;
	}

	isTournamentMedal(): boolean {
		return this.#definition.isTournamentMedal as boolean/*TODO: improve type*/;
	}
}
