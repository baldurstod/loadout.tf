import { createElement, I18n, shadowRootStyle } from 'harmony-ui';
import printfulProductCSS from '../../css/printfulproduct.css';
import { getProductPrice } from './catalog';
import { Product } from './model/product';

export class PrintfulProductElement extends HTMLElement {
	#shadowRoot?: ShadowRoot;
	#product?: Product;
	#visible = false;
	#initialized = false;
	#htmlProductName?: HTMLElement;
	#htmlProductColors?: HTMLElement;
	#htmlProductImage?: HTMLImageElement;
	#htmlPrice?: HTMLElement;
	#doOnce = true;

	connectedCallback() {
		if (!this.#doOnce) {
			return;
		}

		this.#doOnce = false;
		this.#initHTML();
		let callback: IntersectionObserverCallback = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting && (entry.target as PrintfulProductElement).setVisible) {
					(entry.target as PrintfulProductElement).setVisible(true);
					observer.unobserve(entry.target);
				}
			});
		};
		new IntersectionObserver(callback, { threshold: 0 }).observe(this);
	}

	setProduct(product: any/*TODO: improve type*/) {
		this.#product = product;
		if (product) {
			this.#refresh();
		}
	}

	setVisible(visible: boolean) {
		this.#visible = visible;
		if (visible) {
			this.#refresh();
		}
	}

	async #refresh() {
		if (this.#product && this.#visible) {

			let product = this.#product;
			this.#htmlProductName!.innerHTML = product.name;
			this.#htmlProductName!.title = product.name;

			this.#htmlProductImage!.src = product.image;
			this.#htmlProductImage!.title = product.name;

			I18n.setValue(this.#htmlPrice, 'price', await getProductPrice(product.id));

			this.#htmlProductColors?.replaceChildren();
			if (product.colors.length > 1) {
				/*
				const variants = await GetProductVariants(this.#product.id);
				const color2 = new Map<string, string>;
				if (variants) {
					for (const variant of variants) {
						color2.set(variant.colorCode, variant.colorCode2);
					}
				}
				*/

				for (const color of product.colors.toSorted((a, b) => a.getLuminance() - b.getLuminance())) {
					//const c2 = color2.get(color.value);
					createElement('div', {
						parent: this.#htmlProductColors,
						class: 'color',
						/*
						...(c2) && { style: `background:linear-gradient(to right, ${color.value} 0%, ${color.value} 50%, ${c2} 50%, ${c2} 100%)` },
						...(!c2) && { style: `background-color:${color.value}` },
						*/
						style: `background-color:${color.value}`,
						title: color.name,
					});
				}
			}

		}
	}

	#initHTML() {
		if (this.#initialized) {
			return;
		}
		this.#initialized = true;

		this.#shadowRoot = this.attachShadow({ mode: 'closed' });
		shadowRootStyle(this.#shadowRoot, printfulProductCSS);

		this.#htmlProductImage = createElement('img', {
			class: 'image',
			parent: this.#shadowRoot,
		}) as HTMLImageElement;

		this.#htmlProductName = createElement('div', {
			class: 'name',
			parent: this.#shadowRoot,
		});

		this.#htmlProductColors = createElement('div', {
			class: 'colors',
			parent: this.#shadowRoot,
		});

		this.#htmlPrice = createElement('div', {
			class: 'price',
			parent: this.#shadowRoot,
			i18n: {
				innerText: '#product_price',
				values: { price: 0 },
			},
		});
	}

}
customElements.define('printful-product', PrintfulProductElement);
