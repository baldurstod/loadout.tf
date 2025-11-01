import { createElement, defineHarmonyRadio, HTMLHarmonySwitchElement } from 'harmony-ui';
import characterControlCSS from '../../css/charactercontrol.css';
import { Controller, ControllerEvent } from '../controller';
import { Ragdoll } from '../loadout/characters/character';
import { StaticPanel } from './staticpanel';
import { TeamSelector } from './teamselector';

export class CharacterControlPanel extends StaticPanel {
	#teamSelector = new TeamSelector();
	#htmlApplyToAll?: HTMLHarmonySwitchElement;

	constructor() {
		super([characterControlCSS]);
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#teamSelector.getHTMLElement(),
		);
		defineHarmonyRadio();

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
						Controller.dispatchEvent<boolean>(ControllerEvent.SetInvulnerable, { detail: false });
						Controller.dispatchEvent<Ragdoll>(ControllerEvent.SetRagdoll, { detail: Ragdoll.None });
						break;
					case 'invulnerable':
						Controller.dispatchEvent<boolean>(ControllerEvent.SetInvulnerable, { detail: event.detail.state });
						Controller.dispatchEvent<Ragdoll>(ControllerEvent.SetRagdoll, { detail: Ragdoll.None });
						break;
					case 'gold':
						Controller.dispatchEvent<Ragdoll>(ControllerEvent.SetRagdoll, { detail: Ragdoll.Gold });
						break;
					case 'ice':
						Controller.dispatchEvent<Ragdoll>(ControllerEvent.SetRagdoll, { detail: Ragdoll.Ice });
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
					state: true,
				},
				$change: (event: CustomEvent) => Controller.dispatchEvent<boolean>(ControllerEvent.SetApplyToAll, { detail: event.detail.state }),
			}) as HTMLHarmonySwitchElement,
		});
	}
}
