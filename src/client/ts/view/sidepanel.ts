import { ItemsPanel } from './itemspanel';
import { OptionsPanel } from './optionspanel';
import { StaticPanel } from './staticpanel';
import sidePanelCSS from '../../css/sidepanel.css';

export class SidePanel extends StaticPanel {
	#optionsPanel = new OptionsPanel();
	#itemsPanel = new ItemsPanel();

	constructor() {
		super([sidePanelCSS]);
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#optionsPanel.getHTMLElement(),
			this.#itemsPanel.getHTMLElement(),
		);
	}
}
