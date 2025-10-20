import { ItemsPanel } from './itemspanel';
import { OptionsPanel } from './optionspanel';
import { StaticPanel } from './staticpanel';

export class SidePanel extends StaticPanel {
	#optionsPanel = new OptionsPanel();
	#itemsPanel = new ItemsPanel();

	protected override initHTML(): void {
		this.getShadowRoot().append(
			this.#optionsPanel.getHTMLElement(),
			this.#itemsPanel.getHTMLElement(),
		);
	}
}
