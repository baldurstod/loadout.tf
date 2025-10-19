import { createShadowRoot } from 'harmony-ui';

export class SidePanel {
	#shadowRoot?: ShadowRoot;

	#initHTML(): HTMLElement {
		this.#shadowRoot = createShadowRoot('div', {
			class:'SidePanel',
			hidden:true,
		});

		return this.#shadowRoot.host as HTMLElement;
	}


	getHTMLElement(): HTMLElement {
		return this.#shadowRoot?.host as (HTMLElement | undefined) ?? this.#initHTML();
	}
}
