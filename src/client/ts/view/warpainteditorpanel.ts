import { WarpaintEditor } from 'harmony-3d-utils';
import { ShortcutHandler } from 'harmony-browser-utils';
import { hide, toggle } from 'harmony-ui';
import warpaintEditorPanelCSS from '../../css/warpainteditorpanel.css';
import { StaticPanel } from './staticpanel';

export class WarpaintEditorPanel extends StaticPanel {
	constructor() {
		super([warpaintEditorPanelCSS]);
		hide(this.getShadowRoot());
		ShortcutHandler.addEventListener('app.shortcuts.warpaints.openeditor', () => toggle(this.getShadowRoot()));
	}

	protected override initHTML(): void {
		WarpaintEditor.init(this.getShadowRoot());
	}
}
