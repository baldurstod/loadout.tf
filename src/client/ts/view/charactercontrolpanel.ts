import { createElement, defineHarmonyRadio, HTMLHarmonySwitchElement } from 'harmony-ui';
import { Ragdoll, Tf2CharacterManager, Tf2LoadoutController } from 'loadout';
import characterControlCSS from '../../css/charactercontrol.css';
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

		Tf2LoadoutController.addEventListener('characterchanged', () => this.#refreshAnimList());
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
			$input: (event: Event) => Tf2LoadoutController.dispatchEvent('changeanimframe', {
				detail: {
					frame: Number((event.target as HTMLInputElement).value),
					scene: loadoutScene,
				}
			}),
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
						Tf2LoadoutController.dispatchEvent('setinvulnerable', { detail: { invulnerable: false, scene: loadoutScene } });
						Tf2LoadoutController.dispatchEvent('setragdoll', { detail: { ragdoll: Ragdoll.None, scene: loadoutScene } });
						break;
					case 'invulnerable':
						Tf2LoadoutController.dispatchEvent('setinvulnerable', { detail: { invulnerable: event.detail.state, scene: loadoutScene } });
						Tf2LoadoutController.dispatchEvent('setragdoll', { detail: { ragdoll: Ragdoll.None, scene: loadoutScene } });
						break;
					case 'gold':
						Tf2LoadoutController.dispatchEvent('setragdoll', { detail: { ragdoll: Ragdoll.Gold, scene: loadoutScene } });
						break;
					case 'ice':
						Tf2LoadoutController.dispatchEvent('setragdoll', { detail: { ragdoll: Ragdoll.Ice, scene: loadoutScene } });
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
				$change: (event: CustomEvent) => Tf2LoadoutController.dispatchEvent('setapplytoall', { detail: event.detail.state }),
			}) as HTMLHarmonySwitchElement,
		});
	}

	#setAnim(): void {
		// First, try to get the option from the datalist
		for (const option of this.#htmlAnimSelectorDataList!.options) {
			if (option.innerText === this.#htmlAnimSelector!.value) {
				Tf2LoadoutController.dispatchEvent('setanim', {
					detail: {
						anim: option.getAttribute('data-value') as string,
						scene: loadoutScene,
					}
				});
				return;
			}
		}

		// If not found, submit the user input
		Tf2LoadoutController.dispatchEvent('setanim', {
			detail: {
				anim: this.#htmlAnimSelector!.value,
				scene: loadoutScene,
			}
		});
	}

	#refreshAnimList(): void {
		const animsList = Tf2CharacterManager.getAnimList(loadoutScene);
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
