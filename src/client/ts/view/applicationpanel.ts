import { PaintKitDefinitions } from 'harmony-tf2-utils';
import { I18n, createShadowRoot, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyTab, defineHarmonyTabGroup, documentStyle } from 'harmony-ui';
import applicationCSS from '../../css/application.css';
import htmlCSS from '../../css/html.css';
import varsCSS from '../../css/vars.css';
import { ENABLE_PATREON_POWERUSER } from '../bundleoptions';
import { TF2_WARPAINT_DEFINITIONS_URL } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { CharacterSelector } from './characterselector';
import { MainPanel } from './mainpanel';
import { OptionsPanel } from './optionspanel';

documentStyle(htmlCSS);
documentStyle(varsCSS);

export class ApplicationPanel {
	#shadowRoot!: ShadowRoot;
	//#appAdPanel = new AdPanel();
	#appCharacterSelector = new CharacterSelector();
	#appOptions = new OptionsPanel();
	#mainContent = new MainPanel();

	static {
		defineHarmonySwitch();
		defineHarmonyRadio();
		defineHarmonyTab();
		defineHarmonyTabGroup();
		PaintKitDefinitions.setWarpaintDefinitionsURL(TF2_WARPAINT_DEFINITIONS_URL);
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

		for (const item of event.dataTransfer.items) {
			if (item.kind === "file") {
				const file = item.getAsFile();
				if (file) {
					Controller.dispatchEvent<File>(ControllerEvent.ImportFile, { detail: file });
					//this.#importModels2(file, this.#htmlOverrideGameModels.state as boolean);
				}
			}
		}
	}
}
