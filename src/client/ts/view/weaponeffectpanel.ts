import { OptionsManager } from 'harmony-browser-utils';
import { createElement, hide, show } from 'harmony-ui';
import { COMMUNITY_SPARKLE_EFFECT, Tf2Item, weaponEffects } from 'loadout';
import weaponEffectPanelCSS from '../../css/weaponeffectpanel.css';
import { inventoryPath } from '../constants';
import { Panel } from '../enums';
import { DynamicPanel } from './dynamicpanel';

export class WeaponEffectPanel extends DynamicPanel {
	#htmlEffects?: HTMLElement;
	#currentItem?: Tf2Item;
	#htmlItemIcon?: HTMLElement;

	constructor() {
		super(Panel.WeaponEffects, [weaponEffectPanelCSS]);
		hide(this.getShadowRoot());
	}

	protected override initHTML(): void {
		this.#createEffectsView();

		for (const [id, [name, title]] of weaponEffects) {
			if (id === COMMUNITY_SPARKLE_EFFECT && !OptionsManager.getItem('app.effects.displayother')) {
				continue;
			}
			this.#createEffectView(id, name, title);
		}
	}

	#createEffectsView(): void {
		const htmlEffetcsInner = createElement('div', {
			class: 'effects-inner',
			parent: this.getShadowRoot(),
		});

		const effectsDivHeader = createElement('div', { class: 'effects-header' });

		this.#htmlEffects = createElement('div');

		this.#htmlItemIcon = createElement('div', { class: 'selected-item' });

		const closeButton = createElement('button', { class: 'cancelButton' });
		closeButton.innerHTML = 'Close';

		effectsDivHeader.appendChild(this.#htmlItemIcon);
		htmlEffetcsInner.appendChild(effectsDivHeader);
		htmlEffetcsInner.appendChild(this.#htmlEffects);
		htmlEffetcsInner.append(/*colorText, */closeButton);


		this.getHTMLElement().addEventListener('click', (event: Event) => { this.#cancel(); event.stopPropagation(); });
		htmlEffetcsInner.addEventListener('click', event => { event.stopPropagation(); });
		closeButton.addEventListener('click', event => { this.hide(); event.stopPropagation(); });
	}

	#createEffectView(id: number, name: string, title: string): void {
		const effectOption = createElement('img', {
			class: 'effect',
			src: `../../img/unusuals/weapon_unusual_${name}.png`,
			innerText: title,
			$click: (): void => {
				this.#currentItem?.setWeaponEffectId(id);
			}
		});

		effectOption.innerText = ' ';
		this.#htmlEffects!.appendChild(effectOption);
	}

	#cancel(): void {
		this.hide();
	}

	hide(): void {
		hide(this.getHTMLElement());
	}

	selectEffect(item: Tf2Item): void {
		this.getHTMLElement();
		this.#currentItem = item;

		const image = item.getTemplate().imageInventory;
		if (image) {
			if (image.substring(0, 4) == 'http') {
				this.#htmlItemIcon!.style.backgroundImage = 'url(\'' + image + '\')';
			} else {
				this.#htmlItemIcon!.style.backgroundImage = 'url(\'' + inventoryPath + image + '.png\')';
			}
		}

		show(this.getHTMLElement());
	}
}
