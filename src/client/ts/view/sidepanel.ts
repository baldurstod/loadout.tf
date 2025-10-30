import sidePanelCSS from '../../css/sidepanel.css';
import { EffectsPanel } from './effectspanel';
import { ItemsPanel } from './itemspanel';
import { OptionsPanel } from './optionspanel';
import { StaticPanel } from './staticpanel';

export class SidePanel extends StaticPanel {
	#optionsPanel = new OptionsPanel();
	#itemsPanel = new ItemsPanel();
	#effectsPanel = new EffectsPanel();

	constructor() {
		super([sidePanelCSS]);
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#optionsPanel.getHTMLElement(),
			this.#itemsPanel.getHTMLElement(),
			this.#effectsPanel.getHTMLElement(),
		);
	}
}
