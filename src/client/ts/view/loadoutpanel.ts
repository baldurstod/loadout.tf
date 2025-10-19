import { createShadowRoot } from 'harmony-ui';
import { SidePanel } from './sidepanel';
import { Viewer } from './viewer';
import loadoutCSS from '../../css/loadout.css';
import { Toolbar } from './toolbar';

export class LoadoutPanel {
	#shadowRoot?: ShadowRoot;
	#sidePanel = new SidePanel();
	#viewer = new Viewer();
	#toolbar = new Toolbar();

	#initHTML(): HTMLElement {
		this.#shadowRoot = createShadowRoot('div', {
			class:'LoadoutPanel',
			adoptStyle: loadoutCSS,
			childs: [
				this.#sidePanel.getHTMLElement(),
				this.#viewer.getHTMLElement(),
				this.#toolbar.getHTMLElement(),
			],
		});

		return this.#shadowRoot.host as HTMLElement;
	}


	getHTMLElement(): HTMLElement {
		return this.#shadowRoot?.host as (HTMLElement | undefined) ?? this.#initHTML();
	}
}
