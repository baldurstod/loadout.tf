import { createElement, defineHarmonyTab, defineHarmonyTabGroup, hide, HTMLHarmonyTabElement, HTMLHarmonyTabGroupElement, show } from 'harmony-ui';
import effectTemplateCSS from '../../css/effects.css';
import effectsCSS from '../../css/effectspanel.css';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { EffectTemplate, EffectType } from '../loadout/items/effecttemplate';
import { ItemManager } from '../loadout/items/itemmanager';
import { DynamicPanel } from './dynamicpanel';
import { UnusualEffectElement } from './elements/unusualeffect';
export { UnusualEffectElement } from './elements/unusualeffect';

export class EffectsPanel extends DynamicPanel {
	#htmlEffectsTab?: HTMLHarmonyTabElement;
	#htmlKillstreakTab?: HTMLHarmonyTabElement;
	#htmlTauntTab?: HTMLHarmonyTabElement;
	#htmlEffectsList?: HTMLElement;
	#htmlKillstreakList?: HTMLElement;
	#htmlTauntList?: HTMLElement;
	#htmlEffects = new Map<string, UnusualEffectElement>();

	constructor() {
		super(Panel.Effects, [effectsCSS]);
		hide(this.getShadowRoot());
		this.#initListeners();
	}

	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.ItemsLoaded, () => this.#refreshUnusualEffects());
	}

	protected override initHTML(): void {
		defineHarmonyTab();
		defineHarmonyTabGroup();

		createElement('harmony-tab-group', {
			parent: this.getShadowRoot(),
			adoptStyle: effectTemplateCSS,
			childs: [
				this.#htmlEffectsTab = createElement('harmony-tab', {
					parent: this.getShadowRoot(),
					'data-i18n': '#unusual_effects',
					childs: [
						this.#htmlEffectsList = createElement('div', { class: 'effects' }),
					],
					//child: this.#htmlEffectPanelPerClass = createElement('div', { class: 'character-manager-effect-panel-per-class' }),
				}) as HTMLHarmonyTabElement,
				this.#htmlKillstreakTab = createElement('harmony-tab', {
					'data-i18n': '#killstreak_effects',
					parent: this.getShadowRoot(),
				}) as HTMLHarmonyTabElement,
				this.#htmlTauntTab = createElement('harmony-tab', {
					'data-i18n': '#taunt_effects',
					parent: this.getShadowRoot(),
				}) as HTMLHarmonyTabElement,
			],
		}) as HTMLHarmonyTabGroupElement;
	}

	#refreshUnusualEffects(): void {
		// Ensure html is initialized
		this.getHTMLElement();

		for (const [, htmlItem] of this.#htmlEffects) {
			hide(htmlItem);
		}

		for (const [id, template] of ItemManager.getEffects(EffectType.Cosmetic)) {
			let htmlEffect = this.#htmlEffects.get(id);
			if (htmlEffect) {
				this.#htmlEffectsList?.append(htmlEffect);
				show(htmlEffect);
			} else {
				htmlEffect = createElement('unusual-effect', {
					properties: {
						//effect: effect,
						//effectName: effectName,
						//systemName: systemName,
					},
					parent: this.#htmlEffectsList,
					$click: (event: Event) => {
						//click: (event: Event) => setTauntEffect(this.#currentCharacter, /*this.#currentEffect*/undefined, (event.target as EffectManagerEffect).systemName, UnusualTauntListRefireTime.get((event.target as EffectManagerEffect).systemName)),
						console.info((event.target as UnusualEffectElement).getEffectTemplate()?.getName());

						if (event.currentTarget == event.target) {
							Controller.dispatchEvent<EffectTemplate>(ControllerEvent.EffectClicked, { detail: template });
						}

					},
				}) as UnusualEffectElement;

				htmlEffect.setEffectTemplate(template);

				this.#htmlEffects.set(id, htmlEffect);
			}

			/*
			if (selectedItems.has(id)) {
				htmlEffect?.classList.add('item-selected');
			} else {
				htmlEffect?.classList.remove('item-selected');
			}
			*/
		}
	}
}
