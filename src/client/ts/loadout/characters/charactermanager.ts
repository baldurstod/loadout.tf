import { quat, vec3 } from 'gl-matrix';
import { Entity, getSceneExplorer, GraphicMouseEventData, GraphicsEvent, GraphicsEvents } from 'harmony-3d';
import { OptionsManager, OptionsManagerEvents } from 'harmony-browser-utils';
import { JSONObject, uint } from 'harmony-types';
import positionJSON from '../../../json/slotsposition.json';
import { startAnim, TF2_TOOLBOX_MODEL } from '../../constants';
import { Controller, ControllerEvent } from '../../controller';
import { Team } from '../enums';
import { ItemManager } from '../items/itemmanager';
import { firstPersonCamera } from '../scene';
import { ClassAnimations, getClassAnimations } from './animations';
import { Character, Ragdoll } from './character';
import { CharactersList, Tf2Class } from './characters';
import { Preset, Presets } from './preset';

type CharacterSlot = {
	character: Character | null;
	position: vec3;
	orientation: quat;
}

type CharacterPosition = {
	position: vec3;
	orientation: quat;
}

export type CustomDisposition = {
	countX: number,
	countY: number,
	countZ: number,
}

const DEFAULT_ORIENTATION = quat.fromValues(0, 0, -1, 1);
const TOOLBOX_POSITION = vec3.fromValues(-71.0726394653, 195.8566589355, 0);
const TOOLBOX_ORIENTATION = quat.fromValues(0, 0, -0.5927425026893616, 0.8053920269012451);

export class CharacterManager {
	static #characterSlots: CharacterSlot[] = [{ character: null, position: vec3.create(), orientation: quat.clone(DEFAULT_ORIENTATION) }];
	static #currentSlot: CharacterSlot | null = null;
	static #unusedCharacters: Character[] = [];
	static #currentCharacter: Character | null = null;
	static #team: Team = Team.Red;
	static #isInvulnerable = false;
	static #slotsPositions = new Map<string, CharacterPosition[]>();
	static #applyToAll = true;
	static #useBots = false;
	static #presets = new Map<string, Presets>();

	static {
		GraphicsEvents.addEventListener(GraphicsEvent.Tick, () => this.#updatePaintColor());
		GraphicsEvents.addEventListener(GraphicsEvent.MouseDown, (event: Event) => this.#pickedModel(event as CustomEvent<GraphicMouseEventData>));
		Controller.addEventListener(ControllerEvent.SetInvulnerable, (event: Event) => { this.#setInvulnerable((event as CustomEvent<boolean>).detail); return; },);
		Controller.addEventListener(ControllerEvent.SetRagdoll, (event: Event) => { this.#setRagdoll((event as CustomEvent<Ragdoll>).detail); return; },);
		Controller.addEventListener(ControllerEvent.SetAnim, (event: Event) => this.#setAnim((event as CustomEvent<string>).detail));
		Controller.addEventListener(ControllerEvent.SetApplyToAll, (event: Event) => this.#applyToAll = (event as CustomEvent<boolean>).detail);
		Controller.addEventListener(ControllerEvent.UseBots, (event: Event) => this.#useBots = (event as CustomEvent<boolean>).detail);
		Controller.addEventListener(ControllerEvent.ImportPresets, (event: Event) => { this.#importPresets((event as CustomEvent<File[]>).detail) });
		Controller.addEventListener(ControllerEvent.ChangeAnimFrame, (event: Event) => { this.#changeAnimFrame((event as CustomEvent<number>).detail) });

		OptionsManagerEvents.addEventListener('app.loadout.presets', (event: Event) => this.#loadPresets((event as CustomEvent).detail.value));
		this.#initDispositions();
	}

	static async selectCharacter(characterClass: Tf2Class, slotId?: uint): Promise<Character> {
		const slot = this.getSlot(slotId);

		if (slot.character?.characterClass == characterClass) {
			// the same character is selected again
			return slot.character;
		}

		this.#removeCharacter(slot);
		const character = this.#getUnusedCharacter(characterClass) ?? new Character(characterClass);
		slot.character = character;
		// set the character visible
		character.setVisible(true);
		character.setTeam(this.#team);

		const characterTemplate = CharactersList.get(characterClass);
		if (characterTemplate) {
			const modelName = characterTemplate.name;
			character.loadModel(characterTemplate.path, modelName);

			const model = await character.getModel();
			if (model) {
				model.sourceModel.mdl.addExternalMdl('models/player/loadout_tf/' + modelName.toLowerCase().replace(/bots\/[^\/]*\/bot_/, 'player/') + '_loadout_tf_animations.mdl');
				if (model) {
					model.playSequence(startAnim);
					model.setAnimation(0, startAnim, 1);
					model.setPosition(slot.position);
					model.setQuaternion(slot.orientation);
				}
			}
		}

		this.#setCurrentCharacter(character);

		return character;
	}

	static removeCharacter(slotId?: uint): void {
		const slot = this.getSlot(slotId);
		this.#removeCharacter(slot);
	}

	static #getUnusedCharacter(characterClass: Tf2Class): Character | null {
		for (let i = 0; i < this.#unusedCharacters.length; i++) {
			const character = this.#unusedCharacters[i]!;
			if (character.characterClass == characterClass) {
				this.#unusedCharacters.splice(i, 1);
				return character;
			}
		}
		return null;
	}

	static #setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
		//ItemManager.setCharacterClass(character.characterClass);
		ItemManager.setCurrentCharacter(character);
		//EffectManager.setCurrentCharacter(character);
		Controller.dispatchEvent<Character>(ControllerEvent.CharacterChanged, { detail: character });

		(async (): Promise<void> => {
			const model = await character.getModel();
			if (model) {
				const selectedEntity = getSceneExplorer().getSelectedEntity();

				if (!selectedEntity || !selectedEntity.isParent(model)) { // Only switch entity if not parent of currently selected entity
					getSceneExplorer().selectEntity(model);
				}

				model.getBoneByName('bip_head')?.addChild(firstPersonCamera);
			}
		})();
	}

	static #removeCharacter(slot: CharacterSlot): void {
		const character = slot?.character;
		if (character) {
			character.setVisible(false);
			this.#unusedCharacters.push(character);
			slot.character = null;
		}
	}

	static getSlot(slotId?: uint): CharacterSlot {
		if (slotId !== undefined) {
			const slot = this.#characterSlots[slotId];
			if (slot) {
				return slot;
			}
		}

		for (const slot of this.#characterSlots) {
			if (slot == this.#currentSlot || !slot.character || slot.character.characterClass == Tf2Class.None || slot.character.characterClass == Tf2Class.Empty || slot.character.characterClass == Tf2Class.CompareWarpaints) {
				return slot;
			}
		}

		return this.#characterSlots[this.#characterSlots.length - 1]!;
	}

	static setSlotsSize(size: uint, removeExisting = false): void {
		size = Math.max(size, 1);

		const removeStart = removeExisting ? 0 : size - 1;
		for (let i = removeStart; i < this.#characterSlots.length; i++) {
			this.#removeCharacter(this.#characterSlots[i]!);
		}
		for (let i = this.#characterSlots.length; i < size; i++) {
			this.#characterSlots.push({ character: null, position: vec3.create(), orientation: quat.create() });
		}
	}

	static async setTeam(team: Team): Promise<void> {
		this.#team = team;
		if (this.#applyToAll) {
			for (const slot of this.#characterSlots) {
				if (slot) {
					await slot.character?.setTeam(team);
				}
			}
		} else {
			const character = this.#currentCharacter;
			if (character) {
				character.setTeam(team);
			}
		}
	}

	static getTeam(): Team {
		return this.#team;
	}

	static getCurrentCharacter(): Character | null {
		return this.#currentCharacter;
	}

	static setCustomTexture(itemId: string, customTextureName: string): void {
		const currentCharacter = this.getCurrentCharacter();
		if (currentCharacter) {
			const item = currentCharacter.getItemById(itemId);
			if (item) {
				item.setCustomTexture(customTextureName);
			}
		}
	};

	static #updatePaintColor(): void {
		for (const slot of this.#characterSlots) {
			if (slot) {
				slot.character?.updatePaintColor();
			}
		}
	};

	static async #setInvulnerable(invulnerable: boolean): Promise<void> {
		this.#isInvulnerable = invulnerable;
		if (this.#applyToAll) {
			for (const slot of this.#characterSlots) {
				if (slot) {
					await slot.character?.setInvulnerable(invulnerable);
				}
			}
		} else {
			await this.getCurrentCharacter()?.setInvulnerable(invulnerable);
		}
	}

	static async #setRagdoll(ragdoll: Ragdoll): Promise<void> {
		if (this.#applyToAll) {
			for (const slot of this.#characterSlots) {
				if (slot) {
					await slot.character?.setRagdoll(ragdoll);
				}
			}
		} else {
			await this.getCurrentCharacter()?.setRagdoll(ragdoll);
		}
	}

	static #initDispositions(): void {
		const dispositions = positionJSON.dispositions as Record<string, { p: number[], o: number[] }[]>;
		for (const key in dispositions) {
			const slotPosition = dispositions[key]!;
			const positions: CharacterPosition[] = [];
			for (const position of slotPosition) {
				positions.push({
					position: position.p,
					orientation: position.o,
				});
			}
			this.#slotsPositions.set(key, positions);
		}
	}

	static useDisposition(name: string): void {
		//console.info('use disposition: ', name)
		const dispositions = this.#slotsPositions.get(name);
		if (!dispositions) {
			return;
		}

		this.setSlotsSize(dispositions.length);

		for (let i = 0; i < this.#characterSlots.length; i++) {
			const slot = this.#characterSlots[i]!;
			const disposition = dispositions[i];

			if (disposition) {
				slot.position = disposition.position;
				slot.orientation = disposition.orientation;

				if (slot.character) {
					slot.character.getModel().then((model) => {
						model?.setPosition(disposition.position);
						model?.setQuaternion(disposition.orientation);
					});
				}
			}
		}
	}

	static async setupMeetTheTeam(): Promise<void> {
		this.setSlotsSize(9, true);
		this.useDisposition('mtt');

		let botDelta = 0;
		if (this.#useBots) {
			botDelta = Tf2Class.ScoutBot;
		}

		await this.selectCharacter(Tf2Class.Pyro + botDelta, 0);
		const engy = await this.selectCharacter(Tf2Class.Engineer + botDelta, 1);
		await this.selectCharacter(Tf2Class.Spy + botDelta, 2);
		await this.selectCharacter(Tf2Class.Heavy + botDelta, 3);
		await this.selectCharacter(Tf2Class.Sniper + botDelta, 4);
		await this.selectCharacter(Tf2Class.Scout + botDelta, 5);
		await this.selectCharacter(Tf2Class.Soldier + botDelta, 6);
		await this.selectCharacter(Tf2Class.Demoman + botDelta, 7);
		await this.selectCharacter(Tf2Class.Medic + botDelta, 8);
		this.#selectAnim('meettheteam', true);

		const toolbox = await engy.addExtraModel(TF2_TOOLBOX_MODEL);
		if (toolbox) {
			toolbox.setPosition(TOOLBOX_POSITION);
			toolbox.setQuaternion(TOOLBOX_ORIENTATION);
		}
	}

	static #selectAnim(anim: string, applyToAll: boolean, force = false): void {
		/*
		if (!force && this.#htmlAnimSelector.value != '') {
			return;
		}
		*/
		if (applyToAll) {
			for (const slot of this.#characterSlots) {
				slot.character?.setUserAnim(anim);
			}
		} else {
			this.getCurrentCharacter()?.setUserAnim(anim)
		}
	}

	static #setAnim(anim: string): void {
		this.#selectAnim(anim, this.#applyToAll);
	}

	static getAnimList(): ClassAnimations | null {
		const currentClass: Tf2Class | null = this.#currentCharacter?.characterClass ?? null;
		if (currentClass !== null) {
			return getClassAnimations(currentClass);
		}
		return null;
	}

	static #loadPresets(presets: any): void {
		const j = JSON.parse(presets);

		this.#presets.clear();
		//#presets = new Map<string, Presets>();

		for (const name in j) {
			//const preset = presets[name];
			const p = new Presets();
			p.fromJSON(j[name]);
			this.#presets.set(name, p);
		}
		Controller.dispatchEvent(ControllerEvent.PresetsUpdated);
		//this.#updatePresetsPanel();
	}

	static loadPreset(name: string): void {
		if (!this.#currentCharacter) {
			return;
		}

		const npc = CharactersList.get(this.#currentCharacter.characterClass)!.name
		const presets = this.#presets.get(npc);
		if (!presets) {
			return;
		}

		const preset = presets.getPreset(name);
		if (!preset) {
			return;
		}

		this.#currentCharacter.loadPreset(preset);
	}


	static savePresets(): void {
		const j: JSONObject = {};

		for (const [name, presets] of this.#presets) {
			//#presets = new Map<string, Presets>();
			j[name] = presets.toJSON();
		}

		OptionsManager.setItem('app.loadout.presets', JSON.stringify(j));
	}

	static savePreset(name?: string): void {
		if (!this.#currentCharacter || name == '') {
			return;
		}

		const npc = this.#currentCharacter.npc;
		let presets = this.#presets.get(npc)!;
		if (!presets) {
			presets = new Presets();
			this.#presets.set(npc, presets);
		}

		if (!presets.selected && !name) {
			return;
		}

		presets.addPreset(this.#currentCharacter.savePreset(name ?? presets.selected!));
		if (name) {
			presets.selected = name;
		}


		//#presets = new Map<string, Presets>();
		this.savePresets();
		//this.#updatePresetsPanel();
		Controller.dispatchEvent(ControllerEvent.PresetsUpdated);
	}

	static async #importPresets(files: File[]): Promise<void> {
		for (const file of files) {
			await this.#importPreset(file);
		}
		Controller.dispatchEvent(ControllerEvent.PresetsUpdated);
	}

	static async #importPreset(file: File): Promise<void> {
		if (!this.#currentCharacter) {
			return;
		}
		let json: JSONObject;
		try {
			json = JSON.parse(await file.text()) as JSONObject;

			if (!json) {
				return;
			}
		} catch (e) {
			console.error(e);
			return;
		}

		const npc = this.#currentCharacter.npc;
		let presets = this.#presets.get(npc)!;
		if (!presets) {
			presets = new Presets();
			this.#presets.set(npc, presets);
		}

		const preset = new Preset();
		preset.fromJSON(json);

		if (!preset.name || presets.getPreset(preset.name)) {
			preset.name = this.createPresetName();
		}

		presets.addPreset(preset);


	}

	static createPresetName(): string {
		if (!this.#currentCharacter) {
			return '';
		}

		function* nameGenerator(): Generator<string, string, unknown> {
			let gen;
			try {
				const names = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
				let subName = '';

				while (true) {
					if (gen) {
						subName = gen.next().value;
					}
					for (const name of names) {
						yield subName + name;
					}
					if (!gen) {
						gen = nameGenerator();
					}
				}
			} finally {
				gen?.return('');
			}
		}

		const gen = nameGenerator();

		const npc = CharactersList.get(this.#currentCharacter.characterClass)!.name
		const presets = this.#presets.get(npc);
		if (!presets) {
			return gen.next().value;
		}

		while (true) {
			const name = gen.next().value;

			if (!name) {
				continue;
			}

			if (!presets.getPreset(name)) {
				gen.return('');
				return name;
			}
		}
	}

	static setSelectedPreset(preset: string): void {
		if (!this.#currentCharacter) {
			return;
		}
		const npc = CharactersList.get(this.#currentCharacter?.characterClass)!.name
		const presets = this.#presets.get(npc);
		if (presets) {
			presets.selected = preset;
		}
	}

	static getPresets(): Presets | null {
		if (!this.#currentCharacter) {
			return null;
		}
		const npc = CharactersList.get(this.#currentCharacter.characterClass)?.name
		if (!npc) {
			return null;
		}
		return this.#presets.get(npc) ?? null;
	}

	static getCharacters(): Set<Character> {
		const characters = new Set<Character>();

		for (const slot of this.#characterSlots) {
			if (slot.character) {
				characters.add(slot.character);
			}
		}

		return characters;
	}

	static async #changeAnimFrame(frame: number): Promise<void> {
		const source1Model = await this.getCurrentCharacter()?.getModel();
		if (source1Model) {
			const sequence = source1Model.sequences[Object.keys(source1Model.sequences)[0]!];
			if (sequence) {
				source1Model.frame = frame * (sequence.s?.length ?? 1);
			}
		}
	}

	static getSlotsPositions(): Map<string, CharacterPosition[]> {
		return this.#slotsPositions;
	}

	static refreshCustomDisposition(customDisposition: CustomDisposition): void {
		const positions: CharacterPosition[] = [];
		const deltaX = 40;
		const deltaY = 50;
		const deltaZ = 80;

		const startX = -deltaX * 0.5 * (customDisposition.countX - 1);
		const startY = -deltaY * 0.5 * (customDisposition.countY - 1);
		const startZ = -deltaZ * 0.5 * (customDisposition.countZ - 1);

		this.setSlotsSize(customDisposition.countX * customDisposition.countY * customDisposition.countZ);

		for (let x = 0; x < customDisposition.countX; x++) {
			for (let y = 0; y < customDisposition.countY; y++) {
				for (let z = 0; z < customDisposition.countZ; z++) {
					positions.push({
						//origin: [0, deltaY * ((x % 2) * -2 + 1) * Math.floor((x + 1) / 2), 0],
						position: [
							startX + x * deltaX,
							startY + y * deltaY,
							startZ + z * deltaZ,
						],
						orientation: [0, 0, -1, 1],
					})
				}
			}
		}

		this.#slotsPositions.set('custom', positions);
		//this.#setCharactersPositions(new CharactersPositions(positions, true));

		this.useDisposition('custom');
	}

	static #pickedModel(pickEvent: CustomEvent<GraphicMouseEventData>): void {
		const model = pickEvent.detail.entity;
		if (model) {
			this.#selectCharacterPerDynamicProp(model);
		}
	}
	static async #selectCharacterPerDynamicProp(prop: Entity): Promise<void> {
		for (const slot of this.#characterSlots) {
			if (!slot.character) {
				continue;
			}

			const characterModel = await slot.character?.getModel();
			let currentEntity: Entity | null = prop;
			while (currentEntity) {
				if (characterModel == currentEntity) {
					this.#currentSlot = slot;
					this.#setCurrentCharacter(slot.character);
					return;
				}

				currentEntity = currentEntity.parent;
			}
		}
	}
}
