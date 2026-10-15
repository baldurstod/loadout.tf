import { OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement } from 'harmony-ui';
import characterSelectorCSS from '../../css/characterselector.css';
import { Controller, ControllerEvent } from '../controller';
import { CharactersList, CharactersType, Tf2Class } from '../loadout/characters/characters';
import { StaticPanel } from './staticpanel';

export class CharacterSelector extends StaticPanel {
	#htmlCharacterSelectorPanel?: HTMLElement;
	#htmlBotsSelectorPanel?: HTMLElement;
	#htmlInfectedsSelectorPanel?: HTMLElement;
	#styleSheet = new CSSStyleSheet();

	constructor() {
		super([characterSelectorCSS]);
		OptionsManagerEvents.addEventListener('app.characters.showhidden', (event: Event) => this.#styleSheet.replaceSync(`*{--show-hidden: ${(event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value ? 1 : 0};}`));
	}

	protected override initHTML(): void {
		this.#styleSheet.replaceSync('*{--show-hidden: 0;}');
		this.getShadowRoot().adoptedStyleSheets.push(this.#styleSheet);


		this.#htmlCharacterSelectorPanel = createElement('div', { class: 'humans', parent: this.getShadowRoot(), });
		this.#htmlBotsSelectorPanel = createElement('div', { class: 'bots', parent: this.getShadowRoot(), });
		this.#htmlInfectedsSelectorPanel = createElement('div', { class: 'infecteds', parent: this.getShadowRoot(), });

		for (const [tf2Class, character] of CharactersList) {
			switch (character.type) {
				case 'human':
					this.#htmlCharacterSelectorPanel.append(this.#createMiniIcon(tf2Class, character));
					break;
				case 'bot':
					this.#htmlBotsSelectorPanel.append(this.#createMiniIcon(tf2Class, character));
					break;
				case 'infected':
					this.#htmlInfectedsSelectorPanel.append(this.#createMiniIcon(tf2Class, character));
					break;
			}
		}
	}

	#createMiniIcon(tf2Class: Tf2Class, character: CharactersType): HTMLElement {
		const iconName = character.name.toLowerCase();
		return createElement('img', {
			//parent: htmlcharacterIconDiv,
			style: `order: var(--tf2-class-order-${iconName}, unset)`,
			class: `character-icon${character.hidden ? ' hidden' : ''}`,
			src: character.icon,
			$click: () => this.#selectCharacter(tf2Class),
		});
	}

	#selectCharacter(character: Tf2Class): void {
		Controller.dispatchEvent<Tf2Class>(ControllerEvent.SelectCharacter, { detail: character });
	}
}
