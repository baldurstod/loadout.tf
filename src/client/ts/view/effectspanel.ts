import { OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement, defineHarmonyTab, defineHarmonyTabGroup, HarmonySwitchChange, hide, HTMLHarmonyTabElement, HTMLHarmonyTabGroupElement, show } from 'harmony-ui';
import effectsCSS from '../../css/effects.css';
import effectsPanelCSS from '../../css/effectspanel.css';
import { Controller, ControllerEvent, KillstreakClicked } from '../controller';
import { Panel } from '../enums';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Effect } from '../loadout/effects/effect';
import { EffectTemplate, EffectType } from '../loadout/effects/effecttemplate';
import { Team } from '../loadout/enums';
import { ItemManager } from '../loadout/items/itemmanager';
import { KillstreakColor, KillstreakDefinition, killstreakList } from '../paints/killstreaks';
import { colorToCss } from '../utils/colors';
import { DynamicPanel } from './dynamicpanel';
import { UnusualEffectElement } from './elements/unusualeffect';
export { UnusualEffectElement } from './elements/unusualeffect';

const KILLSTREAK_HIGH_GLOW = 20000;

export class EffectsPanel extends DynamicPanel {
	#htmlEffectsTab?: HTMLHarmonyTabElement;
	#htmlKillstreakTab?: HTMLHarmonyTabElement;
	#htmlTauntTab?: HTMLHarmonyTabElement;
	#htmlActiveEffects?: HTMLElement;
	#htmlEffectsList?: HTMLElement;
	#htmlKillstreakColors?: HTMLElement;
	#htmlKillstreakList?: HTMLElement;
	#htmlTauntList?: HTMLElement;
	#htmlEffects = new Map<string, UnusualEffectElement>();
	#htmlKillstreakEffects = new Map<string, UnusualEffectElement>();
	#htmlTauntEffects = new Map<string, UnusualEffectElement>();
	#killstreakColor = KillstreakColor.TeamShine;
	#killstreakEffect: EffectTemplate | null = null;

	constructor() {
		super(Panel.Effects, [effectsPanelCSS]);
		hide(this.getShadowRoot());
		this.#initListeners();
	}

	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.SystemsLoaded, () => {
			this.#refreshUnusualEffects();
			this.#refreshKillstreakEffects();
			this.#refreshTauntEffects();
		});
		Controller.addEventListener(ControllerEvent.EffectAdded, () => this.#refreshActiveList());
		Controller.addEventListener(ControllerEvent.EffectRemoved, () => this.#refreshActiveList());
		Controller.addEventListener(ControllerEvent.CharacterChanged, () => this.#refreshActiveList());
	}

	protected override initHTML(): void {
		defineHarmonyTab();
		defineHarmonyTabGroup();

		const styleSheet = new CSSStyleSheet();
		styleSheet.replaceSync('*{--show-offsets: 0;}');

		createElement('harmony-tab-group', {
			parent: this.getShadowRoot(),
			adoptStyle: effectsCSS,
			adoptStyleSheet: styleSheet,
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
					childs: [
						//this.#htmlActiveEffects = createElement('div', { class: 'active-effects' }),
						this.#htmlKillstreakColors = createElement('div', { class: 'killstreak-colors' }),
						this.#htmlKillstreakList = createElement('div', { class: 'effects-list' }),
					],
				}) as HTMLHarmonyTabElement,
				this.#htmlTauntTab = createElement('harmony-tab', {
					parent: this.getShadowRoot(),
					'data-i18n': '#taunt_effects',
					childs: [
						//this.#htmlActiveEffects = createElement('div', { class: 'active-effects' }),
						createElement('div', {
							class: 'remove-taunt',
							i18n: '#remove_taunt_effect',
							$click: () => Controller.dispatchEvent<null>(ControllerEvent.TauntEffectClicked, { detail: null }),
						}),
						this.#htmlTauntList = createElement('div', { class: 'effects-list' }),
					],
				}) as HTMLHarmonyTabElement,
			],
		}) as HTMLHarmonyTabGroupElement;


		createElement('harmony-switch', {
			parent: this.getShadowRoot(),
			class: 'display-offsets',
			'data-i18n': '#show_offsets',
			$change: (event: CustomEvent<HarmonySwitchChange>) => {
				styleSheet.replaceSync(`*{--show-offsets: ${event.detail.state ? 1 : 0};}`);
			},
		});

		this.#initKillstreakColors();
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
			const cp = system.getControlPoint(0)!/*cp 0 is always defined*/;
			const position = cp.getPosition();
			position[axis] = offset;
			cp.setPosition(position);
		}
	}

	#refreshKillstreakEffects(): void {
		// Ensure html is initialized
		this.getHTMLElement();

		for (const [, htmlItem] of this.#htmlKillstreakEffects) {
			hide(htmlItem);
		}

		for (const [id, template] of ItemManager.getEffects(EffectType.Killstreak)) {
			const idN = Number(id);

			if (idN == 2001 || idN > KILLSTREAK_HIGH_GLOW) {
				continue;
			}

			let htmlEffect = this.#htmlKillstreakEffects.get(id);
			if (htmlEffect) {
				this.#htmlKillstreakList?.append(htmlEffect);
				show(htmlEffect);
			} else {
				htmlEffect = createElement('unusual-effect', {
					parent: this.#htmlKillstreakList,
					$click: () => {
						//Controller.dispatchEvent<KillstreakClicked>(ControllerEvent.KillstreakClicked, { detail: { effect: template, color: this.#killstreakColor } });
						this.#killstreakEffect = template;
						this.#updateKillstreak();
					}
				}) as UnusualEffectElement;

				htmlEffect.setEffectTemplate(template);

				this.#htmlKillstreakEffects.set(id, htmlEffect);
			}
		}
	}

	#initKillstreakColors(): void {
		for (const [killstreakColor, killstreakValue] of killstreakList) {
			if (killstreakColor != KillstreakColor.None) {
				this.#createKillstreakColor(killstreakColor, killstreakValue);
			}
		}
	}

	#createKillstreakColor(color: KillstreakColor, killstreak: KillstreakDefinition): void {
		const killstreakOption = createElement('div', {
			class: 'killstreak',
			$click: () => {
				this.#killstreakColor = color;
				this.#updateKillstreak();
			},
		});
		killstreakOption.style.backgroundColor = colorToCss(killstreak.color1Red);
		OptionsManagerEvents.addEventListener('app.loadout.team', event => {
			if ((event as CustomEvent).detail.value == Team.Red) {
				killstreakOption.style.backgroundColor = colorToCss(killstreak.color1Red);
			} else {
				killstreakOption.style.backgroundColor = colorToCss(killstreak.color1Blu);
			}
		});

		Controller.addEventListener(ControllerEvent.CharacterChanged, () => {
			const team = CharacterManager.getCurrentCharacter()?.getTeam() ?? Team.Red;
			if (team == Team.Red) {
				killstreakOption.style.backgroundColor = colorToCss(killstreak.color1Red);
			} else {
				killstreakOption.style.backgroundColor = colorToCss(killstreak.color1Blu);
			}
		});

		//killstreakOption.innerText = ' ';
		this.#htmlKillstreakColors!.appendChild(killstreakOption);
		//killstreakOption.addEventListener('click', event => { this.#validate(sheen); event.stopPropagation(); })
		//killstreakOption.addEventListener('mouseover', event => { this.#validate2(sheen); this.#htmlSheenTitle!.innerText = sheen.name; event.stopPropagation(); });
	}

	#updateKillstreak(): void {
		Controller.dispatchEvent<KillstreakClicked>(ControllerEvent.KillstreakClicked, { detail: { effect: this.#killstreakEffect, color: this.#killstreakColor } });
	}


	#refreshTauntEffects(): void {
		// Ensure html is initialized
		this.getHTMLElement();

		for (const [, htmlItem] of this.#htmlTauntEffects) {
			hide(htmlItem);
		}

		for (const [id, template] of ItemManager.getEffects(EffectType.Taunt)) {
			let htmlEffect = this.#htmlTauntEffects.get(id);
			if (htmlEffect) {
				this.#htmlTauntList?.append(htmlEffect);
				show(htmlEffect);
			} else {
				htmlEffect = createElement('unusual-effect', {
					parent: this.#htmlTauntList,
					$click: () => {
						Controller.dispatchEvent<EffectTemplate | null>(ControllerEvent.TauntEffectClicked, { detail: template });
					},
				}) as UnusualEffectElement;

				htmlEffect.setEffectTemplate(template);

				this.#htmlTauntEffects.set(id, htmlEffect);
			}
		}
	}
}
