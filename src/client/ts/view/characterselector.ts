import { createElement, display } from 'harmony-ui';
import characterSelectorCSS from '../../css/characterselector.css';
import { Controller, ControllerEvent } from '../controller';
import { CharactersList, CharactersType, Tf2Class } from '../loadout/characters/characters';
import { StaticPanel } from './staticpanel';
import { OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';

export class CharacterSelector extends StaticPanel {
	#htmlCharacterSelectorPanel?: HTMLElement;
	#htmlBotsSelectorPanel?: HTMLElement;
	#styleSheet = new CSSStyleSheet();

	constructor() {
		super([characterSelectorCSS]);
		OptionsManagerEvents.addEventListener('app.characters.showhidden', (event: Event) => this.#styleSheet.replaceSync(`*{--show-hidden: ${(event as CustomEvent<OptionsManagerEvent>).detail.value ? 1 : 0};}`));

		Controller.addEventListener(ControllerEvent.UseBots, (event: Event) => {
			// TODO: remove this when bug https://bugzilla.mozilla.org/show_bug.cgi?id=1795622 is solved
			display(this.#htmlCharacterSelectorPanel, !(event as CustomEvent<boolean>).detail)
			// TODO: remove this when bug https://bugzilla.mozilla.org/show_bug.cgi?id=1795622 is solved
			display(this.#htmlBotsSelectorPanel, (event as CustomEvent<boolean>).detail)
		});
	}

	protected override initHTML(): void {
		this.#styleSheet.replaceSync('*{--show-hidden: 0;}');
		this.getShadowRoot().adoptedStyleSheets.push(this.#styleSheet);


		this.#htmlCharacterSelectorPanel = createElement('div', { class: 'humans', parent: this.getShadowRoot(), });
		this.#htmlBotsSelectorPanel = createElement('div', { class: 'bots', parent: this.getShadowRoot(), hidden: true });

		for (const [tf2Class, character] of CharactersList) {
			if (character.bot) {
				this.#htmlBotsSelectorPanel.append(this.#createMiniIcon(tf2Class, character));
			} else {
				this.#htmlCharacterSelectorPanel.append(this.#createMiniIcon(tf2Class, character));
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
