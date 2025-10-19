import { createElement } from 'harmony-ui';

export class CharacterSelector {
	#htmlElement?: HTMLElement;

	#initHTML(): HTMLElement {
		if (this.#htmlElement) {
			return this.#htmlElement;
		}
		this.#htmlElement = createElement('div', {
			class: 'character-selector',
			childs: [
			],
		});
		return this.#htmlElement;
	}

	getHTMLElement(): HTMLElement {
		return this.#htmlElement ?? this.#initHTML();
	}
}
