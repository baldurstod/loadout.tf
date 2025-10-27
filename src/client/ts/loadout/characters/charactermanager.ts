import { vec3 } from 'gl-matrix';
import { getSceneExplorer, GraphicsEvent, GraphicsEvents } from 'harmony-3d';
import { uint } from 'harmony-types';
import { startAnim } from '../../constants';
import { Controller, ControllerEvent, SetInvulnerable } from '../../controller';
import { Team } from '../enums';
import { ItemManager } from '../items/itemmanager';
import { Character } from './character';
import { CharactersList, Tf2Class } from './characters';

type CharacterSlot = {
	character: Character | null;
	position?: vec3;
	orientation?: vec3;
}

export class CharacterManager {
	static #characterSlots: CharacterSlot[] = [{ character: null }];
	static #currentSlot = 0;
	static #unusedCharacters: Character[] = [];
	static #currentCharacter: Character | null = null;
	static #team: Team = Team.Red;
	static #isInvulnerable = false;

	static {
		GraphicsEvents.addEventListener(GraphicsEvent.Tick, () => this.updatePaintColor());
		Controller.addEventListener(ControllerEvent.SetInvulnerable, (event: Event) => { this.#setInvulnerable((event as CustomEvent<SetInvulnerable>).detail.invulnerable, (event as CustomEvent<SetInvulnerable>).detail.applyToAll); return; },);
	}

	static async selectCharacter(characterClass: Tf2Class, slotId?: uint): Promise<Character> {
		const character = this.#getUnusedCharacter(characterClass) ?? new Character(characterClass);
		const slot = this.#getSlot(slotId);

		if (slot.character?.characterClass == characterClass) {
			// the same character is selected again
			return character;
		}

		this.#removeCharacter(slot);
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
				}
			}
		}

		this.#setCurrentCharacter(character);

		return character;
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

	static setTeam(team: Team): void {
		this.#team = team;
		const character = this.#currentCharacter;
		if (character) {
			character.setTeam(team);
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

	static async  #setInvulnerable(invulnerable: boolean, applyToAll: boolean): Promise<void> {
		this.#isInvulnerable = invulnerable;
		if (applyToAll) {

			for (const slot of this.#characterSlots) {
				if (slot) {
					await slot.character?.setInvulnerable(invulnerable);
				}
			}
		} else {
			await this.getCurrentCharacter()?.setInvulnerable(invulnerable);
		}
	}
}
