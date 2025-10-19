import { createElement, createShadowRoot, I18n } from 'harmony-ui';
import mainCSS from '../../css/main.css';
import { LoadoutPanel } from './loadoutpanel';
import { AdPanel } from './adpanel';
import { ENABLE_PATREON_BASE } from '../bundleoptions';

const AD_DELAY = 1000;

export class MainPanel {
	#shadowRoot?: ShadowRoot;
	#loadoutView = new LoadoutPanel();
	#adPanel = new AdPanel();

	#initHTML(): HTMLElement {
		this.#shadowRoot = createShadowRoot('div', {
			class: 'MainPanel',
			adoptStyle: mainCSS,
			childs: [
				this.#loadoutView.getHTMLElement(),
				ENABLE_PATREON_BASE ? this.#adPanel.getHTMLElement() : null,
			],
		});
		I18n.observeElement(this.#shadowRoot);
		return this.#shadowRoot?.host as HTMLElement;
	}

	getHTMLElement(): HTMLElement {
		return this.#shadowRoot?.host as (HTMLElement | undefined) ?? this.#initHTML();
	}
}
