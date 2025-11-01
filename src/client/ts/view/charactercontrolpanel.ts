import { createElement, defineHarmonyRadio, HTMLHarmonySwitchElement } from 'harmony-ui';
import characterControlCSS from '../../css/charactercontrol.css';
import { Controller, ControllerEvent, SetInvulnerable, SetRagdoll } from '../controller';
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
						Controller.dispatchEvent<SetInvulnerable>(ControllerEvent.SetInvulnerable, { detail: { invulnerable: false, applyToAll: true } });
						Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.None, applyToAll: this.#htmlApplyToAll!.state as boolean } });
						break;
					case 'invulnerable':
						Controller.dispatchEvent<SetInvulnerable>(ControllerEvent.SetInvulnerable, { detail: { invulnerable: event.detail.state, applyToAll: true } });
						Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.None, applyToAll: this.#htmlApplyToAll!.state as boolean } });
						break;
					case 'gold':
						Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.Gold, applyToAll: this.#htmlApplyToAll!.state as boolean } });
						break;
					case 'ice':
						Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.Ice, applyToAll: this.#htmlApplyToAll!.state as boolean } });
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
			}) as HTMLHarmonySwitchElement,
		});
	}
}
