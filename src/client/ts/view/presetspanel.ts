import { createElement, hide } from 'harmony-ui';
import presetsCSS from '../../css/presets.css';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { DynamicPanel } from './dynamicpanel';
import { saveFile } from 'harmony-browser-utils';
import { closeSVG } from 'harmony-svg';
import { ItemManager } from '../loadout/items/itemmanager';
import { inventoryPath } from '../constants';

export class PresetsPanel extends DynamicPanel {
	#htmlPresets?: HTMLElement;
	#updatingPresets = false;

	constructor() {
		super(Panel.Presets, [presetsCSS]);
		hide(this.getShadowRoot());
		Controller.addEventListener(ControllerEvent.PresetsUpdated, (): void => { this.#updatePresets() });
		Controller.addEventListener(ControllerEvent.CharacterChanged, (): void => { this.#updatePresets() });
	}

	protected override initHTML(): void {
		let htmlPresetName: HTMLInputElement;
		const shadowRoot = this.getShadowRoot();
		shadowRoot.host.addEventListener('click', () => hide(shadowRoot));

		createElement('div', {
			class: 'inner',
			parent: shadowRoot,
			childs: [createElement('div', {
				class: 'header',
				childs: [
					createElement('button', {
						i18n: '#add_preset',
						events: {
							click: () => {
								let name = htmlPresetName.value;
								if (name == '') {
									name = CharacterManager.createPresetName();
								}
								CharacterManager.savePreset(name);
							},
						}
					}),
					createElement('button', {
						i18n: '#update_preset',
						events: {
							click: () => {
								CharacterManager.savePreset();
								/*
								if (!this.#currentCharacter) {
									return;
								}

								const presets = this.#presets.get(this.#currentCharacter.npc);
								if (!presets) {
									return;
								}
								if (presets.selected) {
									this.#savePreset(presets.selected);
								}
								*/
							},
						}
					}),
					htmlPresetName = createElement('input', {
						i18n: { placeholder: '#preset_name', },
					}) as HTMLInputElement,
				],
			}),
			this.#htmlPresets = createElement('div', {
				class: 'presets',
			}),
			],
			events: {
				click: (event: Event) => event.stopPropagation(),
			}
		});
		this.#updatePresets();
	}

	async #updatePresets(): Promise<void> {
		if (this.#updatingPresets) {
			return;
		}
		// Ensure html is initialized
		this.getHTMLElement();

		try {
			this.#htmlPresets!.replaceChildren();

			//const presets = this.#presets.get(this.#currentCharacter.npc);
			const presets = CharacterManager.getPresets();
			if (!presets) {
				return;
			}

			this.#updatingPresets = true;

			//await this.initItems3();

			let htmlThumbs: HTMLElement;
			for (const [name, preset] of presets.getPresets()) {
				createElement('div', {
					class: `preset ${name == presets.selected ? 'selected' : ''}`,
					parent: this.#htmlPresets,
					childs: [
						createElement('div', {
							class: 'export',
							i18n: '#export',
							$click: (event: Event) => {
								event.stopPropagation();
								saveFile(new File([JSON.stringify(preset.toJSON())], `preset_${name}.json`))
							},
						}),
						createElement('div', {
							class: 'name',
							innerText: name,
						}),
						htmlThumbs = createElement('div', {
							class: 'thumbs',
						}),

						createElement('div', {
							class: 'remove',
							innerHTML: closeSVG,
							events: {
								click: () => {
									presets.removePreset(name);
									CharacterManager.savePresets();
								}
							},
						}),
					],
					events: {
						click: () => {
							presets.selected = name;
							CharacterManager.loadPreset(name);
							this.#updatePresets();
						}
					}
				});

				for (const presetItem of preset.items) {
					let id = presetItem.id;
					if (presetItem.isWorkshop) {
						await ItemManager.initWorkshopItems();
						id = 'w' + id;
					}
					if (presetItem.isTournamentMedal) {
						await ItemManager.initTournamentMedals();
					}
					const item = ItemManager.getItemTemplate(id);//this.#items.get(id);//ItemTemplates.get(presetItem.id);
					if (!item) {
						continue;
					}
					const imageInventory = item.imageInventory;
					if (!imageInventory) {
						continue;
					}
					let src: string;
					if (imageInventory.startsWith('http')) {
						src = imageInventory;
					} else {
						src = `${inventoryPath}${imageInventory}.png`;
					}
					createElement('img', {
						class: 'thumb',
						src: src,
						parent: htmlThumbs,
					});
				}
			}
		}
		finally {
			this.#updatingPresets = false;
		}


	}

}
