import { addNotification, NotificationType } from 'harmony-browser-utils';
import { createElement, createShadowRoot, I18n, I18nEvents } from 'harmony-ui';
import { setTimeoutPromise } from 'harmony-utils';
import adCSS from '../../css/ad.css';
import adContentCSS from '../../css/adcontent.css';
import { ADSBYGOOGLE_INS, ADSBYGOOGLE_SRC } from '../googleconstants';

const AD_DELAY = 1000;

export class AdPanel {
	#shadowRoot?: ShadowRoot;
	#htmlAdContent?: ShadowRoot;
	#htmlHeader1?: HTMLElement;
	#htmlHeader2?: HTMLElement;

	#initHTML(): HTMLElement {
		this.#shadowRoot = createShadowRoot('div', {
			adoptStyles: [adCSS],
			childs: [
				createElement('div', {
					childs: [
						this.#htmlHeader1 = createElement('div'/*, { i18n: '#advertisement', class: 'title' }*/),
						this.#htmlHeader2 = createElement('div'/*, { i18n: '#how_to_remove' }*/)
					],
					$click: () => addNotification(I18n.getString('#feature_patreon'), NotificationType.Warning, 10),
				}),
				this.#htmlAdContent = createShadowRoot('div', {
					adoptStyles: [adContentCSS],
				}),
			],
		});
		this.#updateStrings();
		I18n.observeElement(this.#shadowRoot);
		this.#setupAdd();

		I18n.addEventListener(I18nEvents.Any, () => this.#updateStrings());
		return this.#shadowRoot.host as HTMLElement;
	}

	async #setupAdd(): Promise<void> {
		const sc = createElement('script', { src: ADSBYGOOGLE_SRC, async: 1 });

		const ad = createElement('div', {
			style: 'width:300px; height:auto;position:absolute;top:3rem;right:0;z-index:1000;',
			parent: document.body,
			innerHTML: ADSBYGOOGLE_INS,
		});

		this.#htmlAdContent!.append(sc);
		((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});

		await setTimeoutPromise(AD_DELAY);
		this.#htmlAdContent!.replaceChildren(...ad.children);
		ad.remove();
	}

	#updateStrings(): void {
		this.#htmlHeader1!.innerText = I18n.getString('#advertisement');
		this.#htmlHeader2!.innerText = I18n.getString('#how_to_remove');
	}

	getHTMLElement(): HTMLElement {
		return this.#shadowRoot?.host as (HTMLElement | undefined) ?? this.#initHTML();
	}
}
