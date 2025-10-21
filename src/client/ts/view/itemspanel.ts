import { hide } from 'harmony-ui';
import itemsCSS from '../../css/items.css';
import { Panel } from '../enums';
import { DynamicPanel } from './dynamicpanel';

export class ItemsPanel extends DynamicPanel {

	constructor() {
		super(Panel.Items, [itemsCSS]);
		hide(this.getShadowRoot());
	}

	protected override initHTML(): void {
		// Do stuff
	}
}
