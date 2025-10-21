import characterControlCSS from '../../css/charactercontrol.css';
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
	}
}
