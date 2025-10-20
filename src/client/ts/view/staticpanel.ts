import { createShadowRoot } from 'harmony-ui';

export class StaticPanel {
	#shadowRoot: ShadowRoot;
	#initialized = false;

	constructor(adoptStyles?: string[]) {
		this.#shadowRoot = createShadowRoot('div', {
			class: this.constructor.name,
			adoptStyles: adoptStyles,
		});
	}

	#initHTML(): void {
		if (!this.#initialized) {
			this.#initialized = true;
			this.initHTML();
		}
	}

	protected initHTML(): void {
		throw new Error('override this method');
	}

	getShadowRoot(): ShadowRoot {
		return this.#shadowRoot/* ?? this.#initHTML())*/;
	}

	getHTMLElement(): HTMLElement {
		this.#initHTML()
		return this.#shadowRoot.host as HTMLElement;
	}
}
