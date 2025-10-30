import { createElement } from 'harmony-ui';
import { UNUSUALS_IMAGES_DIR } from '../../constants';
import { EffectTemplate } from '../../loadout/items/effecttemplate';

export class UnusualEffectElement extends HTMLElement {
	#effectTemplate: EffectTemplate | null = null;
	#visible = false;
	#initialized = false;
	#intersectionObserver?: IntersectionObserver;
	#htmlName?: HTMLElement;

	connectedCallback(): void {
		this.#createHTML();
		this.#refresh();
		this.#initIntersectionObserver();

		this.append(this.#htmlName!);
	}

	#initIntersectionObserver(): void {
		if (!this.#intersectionObserver) {
			const callback: IntersectionObserverCallback = (entries, observer) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						(entry.target as UnusualEffectElement).setVisible(true);
						observer.unobserve(entry.target);
					}
				});
			};
			this.#intersectionObserver = new IntersectionObserver(callback, { threshold: 0 });
			this.#intersectionObserver.observe(this);
		}
	}

	setEffectTemplate(template: EffectTemplate | null): void {
		this.#effectTemplate = template;
		if (template) {
			this.#refresh();
		}
	}

	getEffectTemplate(): EffectTemplate | null {
		return this.#effectTemplate;
	}

	setVisible(visible: true): void {
		this.#visible = visible;
		if (visible) {
			this.#refresh();
		}
	}

	#refresh(): void {
		if (!this.#initialized || !this.#visible || !this.#effectTemplate) {
			return;
		}
		const name = this.#effectTemplate.getName();
		this.setAttribute('title', name);
		this.#htmlName!.innerText = name;
		this.style.backgroundImage = `url(${UNUSUALS_IMAGES_DIR}${this.#effectTemplate.getSystem()}.webp)`;
	}

	#createHTML(): void {
		if (this.#initialized) {
			return;
		}
		this.#htmlName = createElement('div', { class: 'name' });

		this.#initialized = true;
	}
}
customElements.define('unusual-effect', UnusualEffectElement);
