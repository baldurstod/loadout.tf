import { createElement, defineHarmonyTab, defineHarmonyTabGroup, hide, HTMLHarmonyTabElement, HTMLHarmonyTabGroupElement, show } from 'harmony-ui';
import effectTemplateCSS from '../../css/effects.css';
import effectsCSS from '../../css/effectspanel.css';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Effect } from '../loadout/effects/effect';
import { EffectTemplate, EffectType } from '../loadout/effects/effecttemplate';
import { ItemManager } from '../loadout/items/itemmanager';
import { DynamicPanel } from './dynamicpanel';
import { UnusualEffectElement } from './elements/unusualeffect';
export { UnusualEffectElement } from './elements/unusualeffect';

export class EffectsPanel extends DynamicPanel {
	#htmlEffectsTab?: HTMLHarmonyTabElement;
	#htmlKillstreakTab?: HTMLHarmonyTabElement;
	#htmlTauntTab?: HTMLHarmonyTabElement;
	#htmlActiveEffects?: HTMLElement;
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
		Controller.addEventListener(ControllerEvent.SystemsLoaded, () => this.#refreshUnusualEffects());
		Controller.addEventListener(ControllerEvent.EffectAdded, () => this.#refreshActiveList());
		Controller.addEventListener(ControllerEvent.EffectRemoved, () => this.#refreshActiveList());
		Controller.addEventListener(ControllerEvent.CharacterChanged, () => this.#refreshActiveList());
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
					class: 'effects',
					'data-i18n': '#unusual_effects',
					childs: [
						this.#htmlActiveEffects = createElement('div', { class: 'active-effects' }),
						this.#htmlEffectsList = createElement('div', { class: 'effects-list' }),
					],
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
					parent: this.#htmlEffectsList,
					$click: () => {
						Controller.dispatchEvent<EffectTemplate>(ControllerEvent.EffectClicked, { detail: template });
					},
				}) as UnusualEffectElement;

				htmlEffect.setEffectTemplate(template);

				this.#htmlEffects.set(id, htmlEffect);
			}
		}
	}

	#refreshActiveList(): void {
		this.getHTMLElement();

		this.#htmlActiveEffects?.replaceChildren();

		const character = CharacterManager.getCurrentCharacter();
		if (!character) {
			return;
		}

		for (const effect of ItemManager.getSelectedEffects()) {
			const template = ItemManager.getEffectTemplate(effect.getType(), effect.getId());
			if (!template) {
				continue;
			}

			let offsets: HTMLElement;
			createElement('div', {
				class: 'active-effect',
				parent: this.#htmlActiveEffects,
				childs: [
					createElement('img', {
						class: 'thumb',
						src: template.getImage(),
						$click: () => Controller.dispatchEvent<Effect>(ControllerEvent.RemoveEffect, { detail: effect }),
					}),
					offsets = createElement('div', {
						class: 'offset',
					}),
				],
			});

			for (let i = 0; i < 3; i++) {
				createElement('input', {
					parent: offsets,
					type: 'range',
					min: '-10',
					max: '10',
					step: 'any',
					value: '0',
					$input: (event: Event) => this.#setOffset(effect, i, Number((event.target as HTMLInputElement).value)),
				}) as HTMLInputElement;
			}
		}
	}

	#setOffset(effect: Effect, axis: number, offset: number): void {
		const system = effect.system;
		if (system) {
			const cp  = system.getControlPoint(0)!/*cp 0 is always defined*/;
			const position = cp.getPosition();
			position[axis] = offset;
			cp.setPosition(position);
		}
	}
}
