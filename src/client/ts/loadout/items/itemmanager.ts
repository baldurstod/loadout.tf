import { Source1ModelInstance } from 'harmony-3d';
import { Character } from '../characters/character';

export class ItemManager {
	static #currentCharacter: Character | null = null;

	static setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
	}

}
