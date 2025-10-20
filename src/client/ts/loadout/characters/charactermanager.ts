import { vec3 } from 'gl-matrix';
import { getSceneExplorer } from 'harmony-3d';
import { uint } from 'harmony-types';
import { startAnim } from '../../constants';
import { Character } from './character';
import { CharactersList, Tf2Class } from './characters';

type CharacterSlot = {
	character?: Character;
	position?: vec3;
	orientation?: vec3;
}

export class CharacterManager {
	static #characterSlot: CharacterSlot[] = [{}];
	static #currentSlot = 0;
	static #unusedCharacters: Character[] = [];
	static #currentCharacter: Character | null = null;

	static selectCharacter(characterClass: Tf2Class, slot?: uint): Character | null {
		if (slot !== undefined && slot >= this.#characterSlot.length) {
			return null;
		}

		const characterTemplate = CharactersList.get(characterClass)!;
		const character = this.#getUnusedCharacter(characterClass) ?? new Character(characterClass);

		(async (): Promise<void> => {
			const modelName = characterTemplate.model;
			character.loadModel(modelName);

			const model = await character.getModel();
			if (model) {
				model.sourceModel.mdl.addExternalMdl('models/player/loadout_tf/' + modelName.toLowerCase().replace(/bots\/[^\/]*\/bot_/, 'player/') + '_loadout_tf_animations.mdl');
				//characterCM.classIndex = this.characters[character.npc].classIndex;
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
			const character = this.#unusedCharacters[i];
			if (character.characterClass == characterClass) {
				this.#unusedCharacters.splice(i, 1);
				return character;
			}
		}
		return null;
	}

	static #setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
		//new ItemManager().setCurrentCharacter(character);
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
}
