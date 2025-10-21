import { OptionsManager } from 'harmony-browser-utils';
import { createElement } from 'harmony-ui';
import teamSelectorCSS from '../../css/teamselector.css';
import logoBlueWhite from '../../img/logo_blue_white.png';
import logoRedWhite from '../../img/logo_red_white.png';
import { Team } from '../loadout/enums';
import { StaticPanel } from './staticpanel';

export class TeamSelector extends StaticPanel {
	constructor() {
		super([teamSelectorCSS]);
	}

	protected override initHTML(): void {
		const htmlTeamPanelRed = createElement('img', {
			class: 'team',
			src: logoRedWhite,
			$click: () => OptionsManager.setItem('app.loadout.team', Team.Red),
		});
		const htmlTeamPanelBlu = createElement('img', {
			class: 'team',
			src: logoBlueWhite,
			$click: () => OptionsManager.setItem('app.loadout.team', Team.Blu),
		});

		this.getShadowRoot().append(htmlTeamPanelRed, htmlTeamPanelBlu);
	}
}
