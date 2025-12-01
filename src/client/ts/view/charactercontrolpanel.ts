import { createElement, defineHarmonyRadio, HTMLHarmonySwitchElement } from 'harmony-ui';
import characterControlCSS from '../../css/charactercontrol.css';
import { Controller, ControllerEvent, SetInvulnerable, SetRagdoll } from '../controller';
import { Ragdoll } from '../loadout/characters/character';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { loadoutScene } from '../loadout/scene';
import { StaticPanel } from './staticpanel';
import { TeamSelector } from './teamselector';

export class CharacterControlPanel extends StaticPanel {
	#teamSelector = new TeamSelector();
	#htmlApplyToAll?: HTMLHarmonySwitchElement;
	#htmlAnimSelector?: HTMLInputElement;
	#htmlAnimSelectorDataList?: HTMLDataListElement;

	constructor() {
		super([characterControlCSS]);

		Controller.addEventListener(ControllerEvent.CharacterChanged, () => this.#refreshAnimList());
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#teamSelector.getHTMLElement(),
		);
		defineHarmonyRadio();

		this.#htmlAnimSelector = createElement('input', {
			list: 'anim-selector-datalist',
			parent: this.getShadowRoot(),
			$change: () => this.#setAnim(),
			$keyup: () => this.#setAnim(),
		}) as HTMLInputElement;

		this.#htmlAnimSelectorDataList = createElement('datalist', {
			id: 'anim-selector-datalist',
			parent: this.getShadowRoot(),
		}) as HTMLDataListElement;

		createElement('input', {
			parent: this.getShadowRoot(),
			class: 'character-manager-anim-slider',
			type: 'range',
			min: 0,
			max: 1,
			step: 0.01,
			$input: (event: Event) => Controller.dispatchEvent<number>(ControllerEvent.ChangeAnimFrame, { detail: Number((event.target as HTMLInputElement).value) }),
		});

		createElement('harmony-radio', {
			'data-i18n': '#invulnerable',
			parent: this.getShadowRoot(),
			childs: [
				createElement('button', { 'i18n': '#none', value: 'none' }),
				createElement('button', { 'i18n': '#invulnerable', value: 'invulnerable' }),
				createElement('button', { 'i18n': '#gold', value: 'gold' }),
				createElement('button', { 'i18n': '#ice', value: 'ice' }),
			],
			$change: (event: CustomEvent) => {
				//OptionsManager.setItem('app.css.theme', (event).detail.value);
				switch (event.detail.value) {
					case 'none':
						Controller.dispatchEvent<SetInvulnerable>(ControllerEvent.SetInvulnerable, { detail: { invulnerable: false, scene: loadoutScene } });
						Controller.dispatchEvent<Ragdoll>(ControllerEvent.SetRagdoll, { detail: Ragdoll.None });
						break;
					case 'invulnerable':
						Controller.dispatchEvent<SetInvulnerable>(ControllerEvent.SetInvulnerable, { detail: { invulnerable: event.detail.state, scene: loadoutScene } });
						Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.None, scene: loadoutScene } });
						break;
					case 'gold':
						Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.Gold, scene: loadoutScene } });
						break;
					case 'ice':
						Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.Ice, scene: loadoutScene } });
						break;
				}
			},
		});

		createElement('div', {
			class: 'character-manager-display-when-more-than-one-character',
			parent: this.getShadowRoot(),
			child: this.#htmlApplyToAll = createElement('harmony-switch', {
				class: 'apply-to-all',
				'data-i18n': '#apply_to_all',
				attributes: {
					state: 'true',
				},
				$change: (event: CustomEvent) => Controller.dispatchEvent<boolean>(ControllerEvent.SetApplyToAll, { detail: event.detail.state }),
			}) as HTMLHarmonySwitchElement,
		});
	}

	#setAnim(): void {
		// First, try to get the option from the datalist
		for (const option of this.#htmlAnimSelectorDataList!.options) {
			if (option.innerText === this.#htmlAnimSelector!.value) {
				Controller.dispatchEvent<string>(ControllerEvent.SetAnim, { detail: option.getAttribute('data-value') as string });
				return;
			}
		}

		// If not found, submit the user input
		Controller.dispatchEvent<string>(ControllerEvent.SetAnim, { detail: this.#htmlAnimSelector!.value });
	}

	#refreshAnimList(): void {
		const animsList = CharacterManager.getAnimList();
		this.#htmlAnimSelectorDataList?.replaceChildren();
		if (animsList) {
			const list = animsList.animations;
			for (const animI in list) {
				const anim = list[animI]!;
				createElement('option', {
					parent: this.#htmlAnimSelectorDataList,
					innerText: anim.name,
					'data-value': anim.file,
				});
			}
		}
	}
}
