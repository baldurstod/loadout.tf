import { OptionsManager } from 'harmony-browser-utils';
import { WarpaintDefinitions } from 'harmony-tf2-utils';
import { HTMLHarmonySwitchElement, I18n, createElement, createShadowRoot, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyTab, defineHarmonyTabGroup, documentStyle } from 'harmony-ui';
import applicationCSS from '../../css/application.css';
import htmlCSS from '../../css/html.css';
import varsCSS from '../../css/vars.css';
import { ENABLE_PATREON_POWERUSER } from '../bundleoptions';
import { TF2_WARPAINT_DEFINITIONS_URL } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { MainPanel } from './mainpanel';
import { WarpaintEditorPanel } from './warpainteditorpanel';

documentStyle(htmlCSS);
documentStyle(varsCSS);

export class ApplicationPanel {
	#shadowRoot!: ShadowRoot;
	#mainContent = new MainPanel();
	#warpaintPanel = new WarpaintEditorPanel();
	#html3DPopover?: HTMLElement;
	#html3DExportTexture?: HTMLHarmonySwitchElement;
	#html3DSingleMesh?: HTMLHarmonySwitchElement;
	#html3DSmoothMesh?: HTMLHarmonySwitchElement;
	#html3DShowDialog?: HTMLHarmonySwitchElement;

	static {
		defineHarmonySwitch();
		defineHarmonyRadio();
		defineHarmonyTab();
		defineHarmonyTabGroup();
		WarpaintDefinitions.setWarpaintDefinitionsURL(TF2_WARPAINT_DEFINITIONS_URL);
	}

	constructor() {
		this.#initHTML();
	}

	#initHTML(): void {
		this.#shadowRoot = createShadowRoot('div', {
			class: 'ApplicationPanel',
			parent: document.body,
			adoptStyle: applicationCSS,
			childs: [
				this.#mainContent.getHTMLElement(),
				this.#warpaintPanel.getHTMLElement(),
			],
			$dragover: (event: Event) => event.preventDefault(),
			$drop: (event: Event) => this.#handleDrop(event as DragEvent),
		});
		I18n.observeElement(this.#shadowRoot);
		this.#initCSS();
		/*
		this.#shadowRoot.append(
			//this.#appToolbar.htmlElement,
			createElement('div', {
				class: 'maincontent',
				childs: [
					//this.#appOptions.htmlElement,
					//this.#appItemSlots.htmlElement,
					createElement('div', {
						class: 'viewer-container',
						childs: [
							this.#appViewer.htmlElement,
							this.#appCharacterSelector.htmlElement,
							//this.#appMarketPrices.htmlElement,
							//this.#appStyleSelector.htmlElement,
							//this.#appUnitSelector.htmlElement,
						],
					}),
					//this.#appItemList.htmlElement,
					ENABLE_PATREON_BASE ? this.#appAdPanel.getHTMLElement() : null,
				]
			}),
			//this.#appStatusbar.htmlElement,
		);*/

		if (ENABLE_PATREON_POWERUSER) {
			//TODO
			//this.#shadowRoot.append(this.#appExport3DPopover?.htmlElement);
		}

		//this.#appToolbar.setMode();
	}

	#initCSS(): void {
		/*
		TODO
		shadowRootStyle(this.#shadowRoot!, applicationCSS);
		shadowRootStyle(this.#shadowRoot!, loadoutCSS);
		shadowRootStyle(this.#shadowRoot!, characterSelectorCSS);
		shadowRootStyle(this.#shadowRoot!, export3dPopoverCSS);
		shadowRootStyle(this.#shadowRoot!, viewerCSS);
		shadowRootStyle(this.#shadowRoot!, toolbarCSS);
		shadowRootStyle(this.#shadowRoot!, styleSelectorCSS);
		shadowRootStyle(this.#shadowRoot!, statusbarCSS);
		shadowRootStyle(this.#shadowRoot!, marketPricesCSS);
		shadowRootStyle(this.#shadowRoot!, itemSlotsCSS);
		shadowRootStyle(this.#shadowRoot!, itemListItemCSS);
		shadowRootStyle(this.#shadowRoot!, itemListCSS);
		*/
	}

	#handleDrop(event: DragEvent): void {
		event.preventDefault();

		if (!event.dataTransfer) {
			return;
		}

		const files: File[] = [];
		for (const item of event.dataTransfer.items) {
			if (item.kind === "file") {
				const file = item.getAsFile();
				if (file) {
					files.push(file);
				}
			}
		}

		if (files.length) {
			Controller.dispatchEvent<File[]>(ControllerEvent.ImportFiles, { detail: files });
		}
	}

	open3DPopover(): void {
		const popover = this.#getExport3DPopover();

		this.#html3DExportTexture!.state = OptionsManager.getItem('app.objexporter.exporttextures');
		this.#html3DSingleMesh!.state = OptionsManager.getItem('app.objexporter.singlemesh');
		this.#html3DSmoothMesh!.state = OptionsManager.getItem('app.objexporter.subdivide');
		this.#html3DShowDialog!.state = OptionsManager.getItem('app.objexporter.askoptions');

		popover.showPopover();
	}

	#getExport3DPopover(): HTMLElement {
		return this.#html3DPopover ?? this.#create3DPopover();
	}

	#create3DPopover(): HTMLElement {
		this.#html3DPopover = createElement('div', {
			parent: this.#shadowRoot,
			class: 'loadout-application-3dexport-options',
			popover: "auto",
			childs: [
				this.#html3DExportTexture = createElement('harmony-switch', {
					'data-i18n': '#export_textures',
					events: {
						change: () => OptionsManager.setItem('app.objexporter.exporttextures', this.#html3DExportTexture!.state),
					}
				}) as HTMLHarmonySwitchElement,
				this.#html3DSingleMesh = createElement('harmony-switch', {
					'data-i18n': '#single_mesh',
					events: {
						change: () => OptionsManager.setItem('app.objexporter.singlemesh', this.#html3DSingleMesh!.state),
					}
				}) as HTMLHarmonySwitchElement,
				this.#html3DSmoothMesh = createElement('harmony-switch', {
					'data-i18n': '#smooth_mesh',
					events: {
						change: () => OptionsManager.setItem('app.objexporter.subdivide', this.#html3DSmoothMesh!.state),
					}
				}) as HTMLHarmonySwitchElement,
				this.#html3DShowDialog = createElement('harmony-switch', {
					'data-i18n': '#show_this_dialog',
					events: {
						change: () => OptionsManager.setItem('app.objexporter.askoptions', this.#html3DShowDialog!.state),
					}
				}) as HTMLHarmonySwitchElement,
				createElement('button', {
					i18n: '#export_for_3d_print',
					events: {
						click: () => {
							//this.#export3D2();
							Controller.dispatchEvent<boolean>(ControllerEvent.Export3d, { detail: false })
							this.#html3DPopover!.hidePopover();
						},
					}
				}),
				/*createElement('button', {
					i18n: '#export_dont_ask_again',
					events: {
						click: () => { this.#export3D2(); OptionsManager.setItem('app.objexporter.askoptions', false), this.#html3DPopover.hidePopover()},
					}
				}),*/
				createElement('button', {
					i18n: '#cancel',
					events: {
						click: () => this.#html3DPopover!.hidePopover(),
					}
				}),

			]
		});
		return this.#html3DPopover;
	}
}
