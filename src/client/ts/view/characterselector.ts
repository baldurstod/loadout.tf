import { createElement } from 'harmony-ui';
import characterSelectorCSS from '../../css/characterselector.css';
import { Controller, ControllerEvent } from '../controller';
import { CharactersList, CharactersType, Tf2Class } from '../loadout/characters/characters';
import { StaticPanel } from './staticpanel';

export class CharacterSelector extends StaticPanel {
	#htmlCharacterSelectorPanel?: HTMLElement;
	#htmlBotsSelectorPanel?: HTMLElement;

	constructor() {
		super([characterSelectorCSS]);
	}

	protected override initHTML(): void {
		this.#htmlCharacterSelectorPanel = createElement('div', { class: 'humans', });
		this.#htmlBotsSelectorPanel = createElement('div', { class: 'bots', });

		for (const [tf2Class, character] of CharactersList) {
			if (character.hidden) {
				continue;
			}
			if (character.bot) {
				this.#htmlBotsSelectorPanel.append(this.#createMiniIcon(tf2Class, character));
			} else {
				this.#htmlCharacterSelectorPanel.append(this.#createMiniIcon(tf2Class, character));
			}
		}

		this.getShadowRoot().append(this.#htmlCharacterSelectorPanel, this.#htmlBotsSelectorPanel);
	}

	#createMiniIcon(tf2Class: Tf2Class, character: CharactersType): HTMLElement {
		const iconName = character.name.toLowerCase();
		return createElement('img', {
			//parent: htmlcharacterIconDiv,
			style: `order: var(--tf2-class-order-${iconName}, unset)`,
			class: 'character-icon',
			src: character.icon,
			$click: () => this.#selectCharacter(tf2Class),
		});
	}

	#selectCharacter(character: Tf2Class): void {
		Controller.dispatchEvent<Tf2Class>(ControllerEvent.SelectCharacter, { detail: character });
	}
}
