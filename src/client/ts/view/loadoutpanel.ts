import { createShadowRoot } from 'harmony-ui';
import { SidePanel } from './sidepanel';
import { Viewer } from './viewer';
import loadoutCSS from '../../css/loadout.css';

export class LoadoutPanel {
	#shadowRoot?: ShadowRoot;
	#sidePanel = new SidePanel();
	#viewer = new Viewer();

	#initHTML(): HTMLElement {
		this.#shadowRoot = createShadowRoot('div', {
			class:'LoadoutPanel',
			adoptStyle: loadoutCSS,
			childs: [
				this.#sidePanel.getHTMLElement(),
				this.#viewer.getHTMLElement(),
			],
		});

		return this.#shadowRoot.host as HTMLElement;
	}


	getHTMLElement(): HTMLElement {
		return this.#shadowRoot?.host as (HTMLElement | undefined) ?? this.#initHTML();
	}
}
