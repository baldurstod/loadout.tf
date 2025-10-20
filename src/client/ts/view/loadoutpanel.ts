import { createShadowRoot } from 'harmony-ui';
import loadoutCSS from '../../css/loadout.css';
import { CharacterSelector } from './characterselector';
import { SidePanel } from './sidepanel';
import { Toolbar } from './toolbar';
import { Viewer } from './viewer';

export class LoadoutPanel {
	#shadowRoot?: ShadowRoot;
	#sidePanel = new SidePanel();
	#viewer = new Viewer();
	#toolbar = new Toolbar();
	#appCharacterSelector = new CharacterSelector();

	#initHTML(): HTMLElement {
		this.#shadowRoot = createShadowRoot('div', {
			class: 'LoadoutPanel',
			adoptStyle: loadoutCSS,
			childs: [
				this.#sidePanel.getHTMLElement(),
				this.#viewer.getHTMLElement(),
				this.#toolbar.getHTMLElement(),
				this.#appCharacterSelector.getHTMLElement(),
			],
		});

		return this.#shadowRoot.host as HTMLElement;
	}


	getHTMLElement(): HTMLElement {
		return this.#shadowRoot?.host as (HTMLElement | undefined) ?? this.#initHTML();
	}
}
