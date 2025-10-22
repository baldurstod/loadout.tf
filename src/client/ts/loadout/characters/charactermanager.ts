import { vec3 } from 'gl-matrix';
import { getSceneExplorer } from 'harmony-3d';
import { uint } from 'harmony-types';
import { startAnim } from '../../constants';
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

	static selectCharacter(characterClass: Tf2Class, slotId?: uint): Character {
		const characterTemplate = CharactersList.get(characterClass)!;
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

		(async (): Promise<void> => {
			const modelName = characterTemplate.model;
			character.loadModel(modelName);

			const model = await character.getModel();
			if (model) {
				model.sourceModel.mdl.addExternalMdl('models/player/loadout_tf/' + modelName.toLowerCase().replace(/bots\/[^\/]*\/bot_/, 'player/') + '_loadout_tf_animations.mdl');
				if (model) {
					model.playSequence(startAnim);
					model.setAnimation(0, startAnim, 1);
				}
			}
		})();

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
		ItemManager.setCurrentCharacter(character);
		//EffectManager.setCurrentCharacter(character);

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

	static getCurrentCharacter():Character | null {
		return this.#currentCharacter;
	}
}
