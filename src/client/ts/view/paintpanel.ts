import { OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement, hide, show } from 'harmony-ui';
import itemCSS from '../../css/item.css';
import paintPanelCSS from '../../css/paintpanel.css';
import { inventoryPath } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Team } from '../loadout/enums';
import { Item } from '../loadout/items/item';
import { Paint, PaintDefinition, paintList } from '../paints/paints';
import { colorToCss } from '../utils/colors';
import { DynamicPanel } from './dynamicpanel';

export class PaintPanel extends DynamicPanel {
	#htmlPaintsDivPaints?: HTMLElement;
	//#htmlPaintsDivOuter?: HTMLElement;
	#currentItem?: Item;
	#currentPaint: Paint | null = null;
	#htmlItemIcon?: HTMLElement;
	#htmlPaintTitle?: HTMLElement;

	constructor() {
		super(Panel.Paints, [paintPanelCSS, itemCSS]);
		hide(this.getShadowRoot());
	}

	protected override initHTML(): void {
		this.#createPaintsView();

		for (const [, paintValue] of paintList) {
			//paintValue.tintName = paintName;
			this.#createPaintView(paintValue);
			//PaintController.addPaint(paintValue.id, paintName, paintValue.tint1, paintValue.tint2 || paintValue.tint1, paintValue.varying);
		}
	}

	#createPaintsView(): void {
		//this.#htmlPaintsDivOuter = createElement('div', { class: 'paint-manager-paints-outer' });
		const htmlPaintsDivInner = createElement('div', {
			class: 'paints-inner',
			parent: this.getShadowRoot(),
			$click: (event: Event) => event.stopPropagation(),
		});

		const paintsDivHeader = createElement('div', { class: 'paint-header' });

		this.#htmlPaintsDivPaints = createElement('div');

		this.#htmlItemIcon = createElement('div', { class: 'selected-item' });

		this.#htmlPaintTitle = createElement('div', { class: 'paint-title' });

		//var colorText = createElement('input');
		const closeButton = createElement('button', { class: 'cancelButton' });
		closeButton.innerHTML = 'Close';

		const cancelButton = createElement('button', { class: 'cancelButton' });
		cancelButton.innerHTML = 'Cancel';

		const htmlVariablePaintTime = createElement('input', { type: 'range', min: -1, max: 255, value: '-1' }) as HTMLInputElement;
		htmlVariablePaintTime.min = '-1';
		htmlVariablePaintTime.max = '255';
		htmlVariablePaintTime.addEventListener('input', (event) => {
			const value = (event.target as HTMLInputElement).value;
			if (value == '-1') {
				//PaintController.fixedTime = undefined;
			} else {
				//PaintController.fixedTime = Number(value) / 22.0;
			}
		});


		//this.getShadowRoot().appendChild(this.#htmlPaintsDivOuter);
		paintsDivHeader.appendChild(this.#htmlItemIcon);
		paintsDivHeader.appendChild(this.#htmlPaintTitle);
		htmlPaintsDivInner.appendChild(paintsDivHeader);
		//this.#htmlPaintsDivOuter.appendChild(htmlPaintsDivInner);
		htmlPaintsDivInner.appendChild(this.#htmlPaintsDivPaints);
		htmlPaintsDivInner.append(/*colorText, */closeButton, cancelButton, htmlVariablePaintTime);


		this.getHTMLElement().addEventListener('click', (event: Event) => { this.#cancel(); event.stopPropagation(); });
		cancelButton.addEventListener('click', event => { this.#cancel(); event.stopPropagation(); });
		closeButton.addEventListener('click', event => { this.hide(); event.stopPropagation(); });
		//colorText.addEventListener('input', event => {this.validate3(parseInt(event.target.value, 16));this.#htmlPaintTitle.innerHTML = event.target.value;event.stopPropagation();});

		//this.hide();
	}

	#createPaintView(paint: PaintDefinition): void {
		const paintOption = createElement('div', { class: 'paint' });
		paintOption.style.backgroundColor = colorToCss(paint.tintRed);
		OptionsManagerEvents.addEventListener('app.loadout.team', event => {
			if ((event as CustomEvent).detail.value == Team.Red) {
				paintOption.style.backgroundColor = colorToCss(paint.tintRed);
			} else {
				paintOption.style.backgroundColor = colorToCss(paint.tintBlu);
			}
		});

		Controller.addEventListener(ControllerEvent.CharacterChanged, () => {
			const team = CharacterManager.getCurrentCharacter()?.getTeam() ?? Team.Red;
			if (team == Team.Red) {
				paintOption.style.backgroundColor = colorToCss(paint.tintRed);
			} else {
				paintOption.style.backgroundColor = colorToCss(paint.tintBlu);
			}
		});

		paintOption.innerText = ' ';
		//paintOption.value = paint;
		//paintOption.value2 = paintName;
		this.#htmlPaintsDivPaints!.appendChild(paintOption);
		paintOption.addEventListener('click', event => { this.#validate(paint); event.stopPropagation(); })
		paintOption.addEventListener('mouseover', event => { this.#validate2(paint); this.#htmlPaintTitle!.innerText = paint.name; event.stopPropagation(); });
	}

	#validate(def: PaintDefinition): void {
		//CharacterManager.setPaintColor(this.#currentItem.id, def.id);
		this.#validate2(def);
		this.hide();
	}

	#validate2(def: PaintDefinition): void {
		//CharacterManager.setPaintColor(this.#currentItem.id, paint.id);
		this.#currentItem?.setPaint(def.paint);
	}

	#cancel(): void {
		this.#currentItem?.setPaint(this.#currentPaint?.id ?? null);
		this.hide();
	}

	hide(): void {
		hide(this.getHTMLElement());
	}

	selectPaint(item: Item): void {
		this.getHTMLElement();
		this.#currentItem = item;
		this.#currentPaint = item.getPaint();


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
