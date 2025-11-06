import { hide, toggle } from 'harmony-ui';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { StaticPanel } from './staticpanel';

export class DynamicPanel extends StaticPanel {
	#panelType: Panel;

	constructor(panelType: Panel, adoptStyles?: string[]) {
		super(adoptStyles);
		this.#panelType = panelType;
		this.#initListeners();
	}

	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.TogglePanel, (event: Event) => {
			const panel = (event as CustomEvent<Panel>).detail;

			if (panel == this.#panelType) {
				toggle(this.getHTMLElement());
			} else {
				hide(this.getHTMLElement());
			}
		});
	}
}
