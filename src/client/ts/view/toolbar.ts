import { bugReportSVG, fireSVG, manufacturingSVG, moreHorizSVG, overscanSVG, patreonLogoSVG, pauseSVG, photoCameraSVG, playlistAddSVG, playSVG, print3dSVG, sentimentExcitedSVG, settingsSVG, sfmLogoSVG, shareSVG, viewInArSVG } from 'harmony-svg';
import { createElement } from 'harmony-ui';
import toolbarCSS from '../../css/toolbar.css';
import extensionIcon from '../../img/extension_icon.png';
import { TESTING } from '../bundleoptions';
import { ACCURATE_SKINS_EXTENSION_LINK } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { StaticPanel } from './staticpanel';

export class Toolbar extends StaticPanel {

	constructor() {
		super([toolbarCSS]);
	}

	protected override initHTML(): void {
		this.getShadowRoot().append(
			TESTING && createButton('test', '#test', undefined, () => this.#showPanel(Panel.Printful)),
			createButton('canvas', '#hide_all_panels', overscanSVG, () => this.#showPanel(Panel.None)),
			createButton('item-list', '#show_item_list', playlistAddSVG, () => this.#showPanel(Panel.Items)),
			createButton('effects', '#show_unusual_effects', fireSVG, () => this.#showPanel(Panel.Effects)),
			createButton('pause', '#pause', pauseSVG, () => this.#setAnimSpeed(0)),
			createButton('play', '#play', playSVG, () => this.#setAnimSpeed(1)),
			createButton('flexes', '#facial_animations', sentimentExcitedSVG, () => this.#togglePanel(Panel.Flexes)),
			createButton('share', '#share_current_loadout', shareSVG, () => Controller.dispatchEvent(ControllerEvent.ShareLoadout)),
			createButton('picture', '#save_picture', photoCameraSVG, () => Controller.dispatchEvent(ControllerEvent.SavePicture)),
			createButton('sfm', '#export_for_sfm', sfmLogoSVG, () => Controller.dispatchEvent(ControllerEvent.ExportSfm)),

			createButton('export-fbx', '#export_fbx', viewInArSVG, () => Controller.dispatchEvent(ControllerEvent.ExportFbx)),
			createButton('3d', '#export_for_3d_print', print3dSVG, () => Controller.dispatchEvent(ControllerEvent.Export3d)),
			createButton('bug', '#report_bug', bugReportSVG, () => Controller.dispatchEvent(ControllerEvent.ShowBugNotification)),
			createButton('extension', '#accurate_skins_extension', undefined, () => window.open(ACCURATE_SKINS_EXTENSION_LINK, '_blank'), extensionIcon),
			createButton('options', '#options', settingsSVG, () => this.#togglePanel(Panel.Options)),
			createButton('advanced', '#advanced_options', manufacturingSVG, () => Controller.dispatchEvent(ControllerEvent.ToggleOptionsManager)),
			createButton('about', '#about', moreHorizSVG, () => Controller.dispatchEvent(ControllerEvent.ShowAboutNotification)),
			createButton('patreon', '#patreon', patreonLogoSVG, () => Controller.dispatchEvent(ControllerEvent.PatreonClick)),
		);
	}

	#showPanel(panel: Panel): void {
		Controller.dispatchEvent<Panel>(ControllerEvent.ShowPanel, { detail: panel });
	}

	#togglePanel(panel: Panel): void {
		Controller.dispatchEvent<Panel>(ControllerEvent.TogglePanel, { detail: panel });
	}

	#setAnimSpeed(speed: number): void {
		Controller.dispatchEvent<number>(ControllerEvent.SetAnimSpeed, { detail: speed });
	}
}

function createButton(cssSuffix: string, i18n: string, svg?: string, onClick?: () => void, img?: string): HTMLElement {
	return createElement('div', {
		class: 'button button-' + cssSuffix,
		i18n: { title: i18n },
		innerHTML: svg ?? '',
		...(img) && {
			childs: [
				createElement('img', {
					src: img,
				}),
			]
		},
		...onClick && {
			$click: onClick,
		},
	});
}
