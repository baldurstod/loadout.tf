import { createElement } from 'harmony-ui';
import characterSelectorCSS from '../../css/characterselector.css';
import { CharactersList, CharactersType } from '../loadout/characters/characters';
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

		for (const [, character] of CharactersList) {
			if (character.bot) {
				this.#htmlBotsSelectorPanel.append(this.#createMiniIcon(character));
			} else {
				this.#htmlCharacterSelectorPanel.append(this.#createMiniIcon(character));
			}
		}

		this.getShadowRoot().append(this.#htmlCharacterSelectorPanel, this.#htmlBotsSelectorPanel);
	}

	#createMiniIcon(character: CharactersType): HTMLElement {
		//let htmlcharacterIconDiv = createElement('div', {class:'character-manager-character-icon'});
		const iconName = character.name.toLowerCase();
		return createElement('img', {
			//parent: htmlcharacterIconDiv,
			style: `order: var(--tf2-class-order-${iconName}, unset)`,
			class: 'character-manager-character-icon',
			src: character.icon,
			/*
			events: {
				click: () => this.selectCharacter(character),
			},
			*/
		});
	}
}
