import { hide, toggle } from 'harmony-ui';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { StaticPanel } from './staticpanel';

const panels = new Set<DynamicPanel>;

export class DynamicPanel extends StaticPanel {
	#panelType: Panel;
	readonly exclusive: boolean;

	static {
		Controller.addEventListener(ControllerEvent.TogglePanel, (event: Event) => {
			if ((event as CustomEvent<Panel>).detail == Panel.None) {
				for (const panel of panels) {
					hide(panel.getHTMLElement());
				}
			}
		});
	}

	constructor(panelType: Panel, adoptStyles?: string[], exclusive = true) {
		super(adoptStyles);
		this.#panelType = panelType;
		this.exclusive = exclusive;
		this.#initListeners();
		panels.add(this);
	}

	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.TogglePanel, (event: Event) => {
			const panel = (event as CustomEvent<Panel>).detail;

			if (panel == this.#panelType) {
				toggle(this.getHTMLElement());
				if (this.exclusive) {
					for (const panel of panels) {
						if (panel == this) {
							continue;
						}

						if ((panel.exclusive)) {
							hide(panel.getHTMLElement());
						}
					}
				}
			}
		});
	}
}
