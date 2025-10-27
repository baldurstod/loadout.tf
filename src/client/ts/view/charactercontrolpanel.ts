import { createElement, HarmonySwitchChange } from 'harmony-ui';
import characterControlCSS from '../../css/charactercontrol.css';
import { Controller, ControllerEvent, SetInvulnerable } from '../controller';
import { StaticPanel } from './staticpanel';
import { TeamSelector } from './teamselector';

export class CharacterControlPanel extends StaticPanel {
	#teamSelector = new TeamSelector();

	constructor() {
		super([characterControlCSS]);
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#teamSelector.getHTMLElement(),
		);

		createElement('div', {
			class: 'character-manager-display-when-more-than-one-character',
			parent: this.getShadowRoot(),
			child: createElement('harmony-switch', {
				class: 'apply-to-all',
				'data-i18n': '#invulnerable',
				$change: (event: CustomEvent<HarmonySwitchChange>) => Controller.dispatchEvent<SetInvulnerable>(ControllerEvent.SetInvulnerable, { detail: { invulnerable: event.detail.state!, applyToAll: true } }),
			}),
		});

	}
}
