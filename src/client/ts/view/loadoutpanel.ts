import { ShortcutHandler } from 'harmony-browser-utils';
import { toggle } from 'harmony-ui';
import loadoutCSS from '../../css/loadout.css';
import { CharacterControlPanel } from './charactercontrolpanel';
import { CharacterSelector } from './characterselector';
import { FlexesPanel } from './flexespanel';
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
	#flexesPanel = new FlexesPanel();

	constructor() {
		super([loadoutCSS]);
		ShortcutHandler.addEventListener('app.shortcuts.viewer.hideui', () => this.#toggleUi());
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#sidePanel.getHTMLElement(),
			this.#viewer.getHTMLElement(),
			this.#toolbar.getHTMLElement(),
			this.#characterSelector.getHTMLElement(),
			this.#characterControlPanel.getHTMLElement(),
			this.#flexesPanel.getHTMLElement(),
		);
	}

	#toggleUi(): void {
		toggle(this.#toolbar.getHTMLElement());
		toggle(this.#characterSelector.getHTMLElement());
		toggle(this.#characterControlPanel.getHTMLElement());
	}
}
