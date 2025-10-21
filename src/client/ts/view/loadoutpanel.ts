import loadoutCSS from '../../css/loadout.css';
import { CharacterControlPanel } from './charactercontrolpanel';
import { CharacterSelector } from './characterselector';
import { SidePanel } from './sidepanel';
import { StaticPanel } from './staticpanel';
import { Toolbar } from './toolbar';
import { Viewer } from './viewer';

export class LoadoutPanel extends StaticPanel {
	#sidePanel = new SidePanel();
	#viewer = new Viewer();
	#toolbar = new Toolbar();
	#characterSelector = new CharacterSelector();
	#characterControlPanel = new CharacterControlPanel();

	constructor() {
		super([loadoutCSS]);
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#sidePanel.getHTMLElement(),
			this.#viewer.getHTMLElement(),
			this.#toolbar.getHTMLElement(),
			this.#characterSelector.getHTMLElement(),
			this.#characterControlPanel.getHTMLElement(),
		);
	}
}
