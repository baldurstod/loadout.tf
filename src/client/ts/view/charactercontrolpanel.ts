import { createElement, defineHarmonyRadio, HarmonySwitchChange } from 'harmony-ui';
import characterControlCSS from '../../css/charactercontrol.css';
import { Controller, ControllerEvent, SetInvulnerable, SetRagdoll } from '../controller';
import { StaticPanel } from './staticpanel';
import { TeamSelector } from './teamselector';
import { Ragdoll } from '../loadout/characters/character';

export class CharacterControlPanel extends StaticPanel {
	#teamSelector = new TeamSelector();

	constructor() {
		super([characterControlCSS]);
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#teamSelector.getHTMLElement(),
		);
		defineHarmonyRadio();

		createElement('div', {
			class: 'character-manager-display-when-more-than-one-character',
			parent: this.getShadowRoot(),
			child: createElement('harmony-radio', {
				'data-i18n': '#invulnerable',

				childs: [
					createElement('button', { 'i18n': '#none', value: 'none' }),
					createElement('button', { 'i18n': '#invulnerable', value: 'invulnerable' }),
					createElement('button', { 'i18n': '#golg', value: 'gold' }),
					createElement('button', { 'i18n': '#ice', value: 'ice' }),
				],
				$change: (event: CustomEvent) => {
					//OptionsManager.setItem('app.css.theme', (event).detail.value);
					switch (event.detail.value) {
						case 'none':
							Controller.dispatchEvent<SetInvulnerable>(ControllerEvent.SetInvulnerable, { detail: { invulnerable: false, applyToAll: true } });
							Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.None, applyToAll: true } });
							break;
						case 'invulnerable':
							Controller.dispatchEvent<SetInvulnerable>(ControllerEvent.SetInvulnerable, { detail: { invulnerable: event.detail.state, applyToAll: true } });
							Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.None, applyToAll: true } });
							break;
						case 'gold':
							Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.Gold, applyToAll: true } });
							break;
						case 'ice':
							Controller.dispatchEvent<SetRagdoll>(ControllerEvent.SetRagdoll, { detail: { ragdoll: Ragdoll.Ice, applyToAll: true } });
							break;
					}
				},
			}),
		});

	}
}
