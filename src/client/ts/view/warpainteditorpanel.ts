import { WarpaintEditor } from 'harmony-3d-utils';
import { ShortcutHandler } from 'harmony-browser-utils';
import { createElement, hide, HTMLHarmonyPanelElement, isVisible, toggle } from 'harmony-ui';
import warpaintEditorPanelCSS from '../../css/warpainteditorpanel.css';
import { setUpdatePreview } from '../loadout/items/updatepreview';
import { StaticPanel } from './staticpanel';

export class WarpaintEditorPanel extends StaticPanel {
	constructor() {
		super([warpaintEditorPanelCSS]);
		hide(this.getShadowRoot());
		ShortcutHandler.addEventListener('app.shortcuts.warpaints.openeditor', () => {
			toggle(this.getShadowRoot());
			setUpdatePreview(isVisible(this.getShadowRoot()));
			if (isVisible(this.getShadowRoot())) {
				WarpaintEditor.getGui().redrawAllNodes();
			}
		});
	}

	protected override initHTML(): void {
		let panel: HTMLHarmonyPanelElement;
		createElement('harmony-panel', {
			'has-header': 0,
			parent: this.getShadowRoot(),
			child: panel = createElement('harmony-panel', {
				i18n: '#warpaint_editor',
			}) as HTMLHarmonyPanelElement,
		}) as HTMLHarmonyPanelElement;

		WarpaintEditor.init(panel);
	}
}
