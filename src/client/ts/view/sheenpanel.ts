import { OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement, hide, show } from 'harmony-ui';
import itemCSS from '../../css/item.css';
import sheenPanelCSS from '../../css/sheenpanel.css';
import { inventoryPath } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Team } from '../loadout/enums';
import { Item } from '../loadout/items/item';
import { getKillstreak, Killstreak, KillstreakDefinition, killstreakList } from '../paints/killstreaks';
import { colorToCss } from '../utils/colors';
import { DynamicPanel } from './dynamicpanel';

export class SheenPanel extends DynamicPanel {
	#htmlSheensDivSheens?: HTMLElement;
	#currentItem?: Item;
	#currentSheen: Killstreak | null = null;
	#htmlItemIcon?: HTMLElement;
	#htmlSheenTitle?: HTMLElement;

	constructor() {
		super(Panel.Sheens, [sheenPanelCSS, itemCSS]);
		hide(this.getShadowRoot());
	}

	protected override initHTML(): void {
		this.#createSheensView();

		for (const [, sheenValue] of killstreakList) {
			this.#createSheenView(sheenValue);
		}
	}

	#createSheensView(): void {
		const htmlSheensDivInner = createElement('div', {
			class: 'sheens-inner',
			parent: this.getShadowRoot(),
		});

		const sheensDivHeader = createElement('div', { class: 'sheen-header' });

		this.#htmlSheensDivSheens = createElement('div');

		this.#htmlItemIcon = createElement('div', { class: 'selected-item' });

		this.#htmlSheenTitle = createElement('div', { class: 'sheen-title' });

		//var colorText = createElement('input');
		const closeButton = createElement('button', { class: 'cancelButton' });
		closeButton.innerHTML = 'Close';

		const cancelButton = createElement('button', { class: 'cancelButton' });
		cancelButton.innerHTML = 'Cancel';

		sheensDivHeader.appendChild(this.#htmlItemIcon);
		sheensDivHeader.appendChild(this.#htmlSheenTitle);
		htmlSheensDivInner.appendChild(sheensDivHeader);
		htmlSheensDivInner.appendChild(this.#htmlSheensDivSheens);
		htmlSheensDivInner.append(/*colorText, */closeButton, cancelButton);


		this.getHTMLElement().addEventListener('click', (event: Event) => { this.#cancel(); event.stopPropagation(); });
		htmlSheensDivInner.addEventListener('click', event => { event.stopPropagation(); });
		cancelButton.addEventListener('click', event => { this.#cancel(); event.stopPropagation(); });
		closeButton.addEventListener('click', event => { this.hide(); event.stopPropagation(); });
		//colorText.addEventListener('input', event => {this.validate3(parseInt(event.target.value, 16));this.#htmlPaintTitle.innerHTML = event.target.value;event.stopPropagation();});

		//this.hide();
	}

	#createSheenView(sheen: KillstreakDefinition): void {
		const sheenOption = createElement('div', { class: 'sheen' });
		sheenOption.style.backgroundColor = colorToCss(sheen.sheenRed);
		OptionsManagerEvents.addEventListener('app.loadout.team', event => {
			if ((event as CustomEvent).detail.value == Team.Red) {
				sheenOption.style.backgroundColor = colorToCss(sheen.sheenRed);
			} else {
				sheenOption.style.backgroundColor = colorToCss(sheen.sheenBlu);
			}
		});

		Controller.addEventListener(ControllerEvent.CharacterChanged, () => {
			const team = CharacterManager.getCurrentCharacter()?.getTeam() ?? Team.Red;
			if (team == Team.Red) {
				sheenOption.style.backgroundColor = colorToCss(sheen.sheenRed);
			} else {
				sheenOption.style.backgroundColor = colorToCss(sheen.sheenBlu);
			}
		});

		sheenOption.innerText = ' ';
		this.#htmlSheensDivSheens!.appendChild(sheenOption);
		sheenOption.addEventListener('click', event => { this.#validate(sheen); event.stopPropagation(); })
		sheenOption.addEventListener('mouseover', event => { this.#validate2(sheen); this.#htmlSheenTitle!.innerText = sheen.name; event.stopPropagation(); });
	}

	#validate(def: KillstreakDefinition): void {
		this.#validate2(def);
		this.hide();
	}

	#validate2(def: KillstreakDefinition): void {
		this.#currentItem?.setSheen(getKillstreak(def.sheen));
	}

	#cancel(): void {
		this.#currentItem?.setSheen(this.#currentSheen);
		this.hide();
	}

	hide(): void {
		hide(this.getHTMLElement());
	}

	selectSheen(item: Item): void {
		this.getHTMLElement();
		this.#currentItem = item;
		this.#currentSheen = item.getSheen();


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
