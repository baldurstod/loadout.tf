import { quat, vec3 } from 'gl-matrix';
import { getSceneExplorer, GraphicsEvent, GraphicsEvents } from 'harmony-3d';
import { uint } from 'harmony-types';
import positionJSON from '../../../json/slotsposition.json';
import { startAnim } from '../../constants';
import { Controller, ControllerEvent } from '../../controller';
import { Team } from '../enums';
import { ItemManager } from '../items/itemmanager';
import { Character, Ragdoll } from './character';
import { CharactersList, Tf2Class } from './characters';
import { ClassAnimations, getClassAnimations } from './animations';

type CharacterSlot = {
	character: Character | null;
	position: vec3;
	orientation: quat;
}

type CharacterPosition = {
	position: vec3;
	orientation: quat;
}

const DEFAULT_ORIENTATION = quat.fromValues(0, 0, -1, 1);

export class CharacterManager {
	static #characterSlots: CharacterSlot[] = [{ character: null, position: vec3.create(), orientation: quat.clone(DEFAULT_ORIENTATION) }];
	static #currentSlot = 0;
	static #unusedCharacters: Character[] = [];
	static #currentCharacter: Character | null = null;
	static #team: Team = Team.Red;
	static #isInvulnerable = false;
	static #slotsPositions = new Map<string, CharacterPosition[]>();
	static #applyToAll = true;
	static #useBots = false;

	static {
		GraphicsEvents.addEventListener(GraphicsEvent.Tick, () => this.updatePaintColor());
		Controller.addEventListener(ControllerEvent.SetInvulnerable, (event: Event) => { this.#setInvulnerable((event as CustomEvent<boolean>).detail); return; },);
		Controller.addEventListener(ControllerEvent.SetRagdoll, (event: Event) => { this.#setRagdoll((event as CustomEvent<Ragdoll>).detail); return; },);
		Controller.addEventListener(ControllerEvent.SetAnim, (event: Event) => this.#setAnim((event as CustomEvent<string>).detail));
		Controller.addEventListener(ControllerEvent.SetApplyToAll, (event: Event) => this.#applyToAll = (event as CustomEvent<boolean>).detail);
		Controller.addEventListener(ControllerEvent.UseBots, (event: Event) => this.#useBots = (event as CustomEvent<boolean>).detail);
		this.#initDispositions();
	}

	static async selectCharacter(characterClass: Tf2Class, slotId?: uint): Promise<Character> {
		const slot = this.#getSlot(slotId);

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
		const slot = this.#getSlot(slotId);
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

	static #getSlot(slotId?: uint): CharacterSlot {
		if (slotId !== undefined) {
			const slot = this.#characterSlots[slotId];
			if (slot) {
				return slot;
			}
		}

		for (const slot of this.#characterSlots) {
			if (!slot.character) {
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

	static updatePaintColor(): void {
		for (const slot of this.#characterSlots) {
			if (slot) {
				slot.character?.updatePaintColor();
			}
		}
	};

	static async  #setInvulnerable(invulnerable: boolean): Promise<void> {
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

	static async  #setRagdoll(ragdoll: Ragdoll): Promise<void> {
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

	static #useDisposition(name: string): void {
		const dispositions = this.#slotsPositions.get(name);
		if (!dispositions) {
			return;
		}

		for (let i = 0; i < this.#characterSlots.length; i++) {
			const slot = this.#characterSlots[i]!;
			const disposition = dispositions[i];

			if (disposition) {
				slot.position = disposition.position;
				slot.orientation = disposition.orientation;
			}
		}
	}

	static async setupMeetTheTeam(): Promise<void> {
		this.setSlotsSize(9, true);
		this.#useDisposition('mtt');

		let botDelta = 0;
		if (this.#useBots) {
			botDelta = Tf2Class.ScoutBot;
		}

		await this.selectCharacter(Tf2Class.Pyro + botDelta, 0);
		await this.selectCharacter(Tf2Class.Engineer + botDelta, 1);
		await this.selectCharacter(Tf2Class.Spy + botDelta, 2);
		await this.selectCharacter(Tf2Class.Heavy + botDelta, 3);
		await this.selectCharacter(Tf2Class.Sniper + botDelta, 4);
		await this.selectCharacter(Tf2Class.Scout + botDelta, 5);
		await this.selectCharacter(Tf2Class.Soldier + botDelta, 6);
		await this.selectCharacter(Tf2Class.Demoman + botDelta, 7);
		await this.selectCharacter(Tf2Class.Medic + botDelta, 8);
		this.#selectAnim('meettheteam', true);
		/*
		const toolbox = this.#toolboxModel ?? await ModelManager.addTF2Model(TF2_TOOLBOX_MODEL);
		if (toolbox) {
			this.#toolboxModel = toolbox;

			let q = quat.create();
			quat.rotateZ(q, q, -Math.PI * 0.5);
			let o = vec3.transformQuat(vec3.create(), [-195.8566589355, -71.0726394653, 0], q);
			let oo = quat.mul(quat.create(), [0, 0, 0.1503659188747406, 0.9886304140090942], q);
			toolbox.position = o;

			toolbox.quaternion = oo;
			toolbox.skin = String(new OptionsManager().getItem('app.loadout.team') == 'RED' ? 0 : 1);
		}
		//new OptionsManager().addEventListener('app.loadout.team', (event) => {toolbox.setSkin(this.getCharacter(1).characterModel.skin);});

		Controller.dispatchEvent(new CustomEvent(EVENT_SETUP_MEET_THE_TEAM));
		*/
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
		const currentClass = this.#currentCharacter?.characterClass;
		if (currentClass) {
			return getClassAnimations(currentClass);
		}
		return null;
	}
}
