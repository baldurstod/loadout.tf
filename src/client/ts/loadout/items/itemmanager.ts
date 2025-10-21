import { Source1ModelInstance } from 'harmony-3d';
import { Character } from '../characters/character';

export class ItemManager {
	static #currentCharacter: Character | null = null;
	#lang = 'english';

	static setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
	}

	setLang(lang: string) {
		this.#lang = lang;
	}

}
