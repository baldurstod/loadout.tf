import { Controller, ControllerEvent, SetItemFilter } from '../../controller';
import { Character } from '../characters/character';
import { ItemFilter } from './itemfilter';

export class ItemManager {
	static #filters = new ItemFilter();
	static #currentCharacter: Character | null = null;
	static #lang = 'english';

	static {
		this.#initListeners();

	}

	static setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
	}

	static setLang(lang: string): void {
		this.#lang = lang;
	}

	static #initListeners(): void {
		Controller.addEventListener(ControllerEvent.SetItemFilter, (event: Event) => this.setItemFilter((event as CustomEvent<SetItemFilter>).detail));
	}

	static setItemFilter(filter: SetItemFilter): void {
		this.#filters.setAttribute(filter.name, filter.value);

	}




}
