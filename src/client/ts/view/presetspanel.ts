import { createElement, hide } from 'harmony-ui';
import presetsCSS from '../../css/presets.css';
import { Panel } from '../enums';
import { DynamicPanel } from './dynamicpanel';

export class PresetsPanel extends DynamicPanel {

	constructor() {
		super(Panel.Presets, [presetsCSS]);
		hide(this.getShadowRoot());
	}

	protected override initHTML(): void {
		const shadowRoot = this.getShadowRoot();
		shadowRoot.host.addEventListener('click', () => hide(shadowRoot));

		createElement('div', {
			class: 'inner',
			parent: shadowRoot,
		});
	}

}
