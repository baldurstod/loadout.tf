import { Character } from '../characters/character';

export class ItemManager {
	static #currentCharacter: Character | null = null;
	#lang = 'english';

	static setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
	}

	setLang(lang: string): void {
		this.#lang = lang;
	}

}
