import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { sortAlphabeticalReverseSVG, sortAlphabeticalSVG } from 'harmony-svg';
import { createElement, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyToggleButton, hide, HTMLHarmonyRadioElement, HTMLHarmonySwitchElement, HTMLHarmonyToggleButtonElement, toggle } from 'harmony-ui';
import itemCSS from '../../css/item.css';
import itemPanelCSS from '../../css/itempanel.css';
import { Controller, ControllerEvent, SetItemFilter } from '../controller';
import { Panel } from '../enums';
import { ItemManager } from '../loadout/items/itemmanager';
import { DynamicPanel } from './dynamicpanel';
import { PresetsPanel } from './presetspanel';
export { ItemManagerItem } from './itemmanageritem';

export class ItemsPanel extends DynamicPanel {
	#htmlActiveItems?: HTMLElement;
	//#htmlFiltersContainer?: HTMLElement;
	#htmlNameFilterContainer?: HTMLElement;
	#htmlItems?: HTMLElement;
	#htmlSortType?: HTMLSelectElement;
	#filterInputDataList?: HTMLDataListElement;
	#htmlFilterCollection?: HTMLSelectElement;
	#htmlFilterInput?: HTMLInputElement;
	#presetsPanel = new PresetsPanel();
	#updatingPresets = false;

	constructor() {
		super(Panel.Items, [itemPanelCSS, itemCSS]);
		hide(this.getShadowRoot());
		this.#initListeners();
	}


	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.ItemsLoaded, () => this.#refreshItems());
	}

	protected override initHTML(): void {
		defineHarmonySwitch();
		defineHarmonyRadio();
		defineHarmonyToggleButton();
		const shadowRoot = this.getShadowRoot();

		createElement('div', {
			class: 'line-active',
			parent: shadowRoot,
			childs: [
				this.#htmlActiveItems = createElement('div', {
					class: 'active-items',
				}),
				createElement('div', {
					class: 'preset-button',
					i18n: '#presets',
					$click: () => toggle(this.#presetsPanel.getHTMLElement()),
				}),
			],
		});

		let htmlTypeRadio: HTMLHarmonyRadioElement;
		let htmlSwitchFilterPerClass: HTMLHarmonySwitchElement;
		let htmlShowHalloween: HTMLHarmonySwitchElement;
		let htmlShowPaintable: HTMLHarmonySwitchElement;
		let htmlSortDirection: HTMLHarmonyToggleButtonElement;
		let htmlShowWarpaintable: HTMLHarmonySwitchElement;
		let htmlCollapsableFiltersButton: HTMLHarmonySwitchElement;
		const htmlCollapsableFiltersContainer = createElement('div', {
			class: 'line-filters',
			parent: shadowRoot,
			childs: [
				createElement('div', {
					class: 'filter-misc-container',
					childs: [
						createElement('harmony-radio', {
							childs: [
								createElement('button', { 'i18n': '#items', value: 'items', attributes: { selected: '' } }),
								createElement('button', {
									'i18n': '#tournament_medals',
									value: 'tournament',
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'tournamentMedals', value: event.detail.state } }),
								}),
								createElement('button', {
									'i18n': '#workshop',
									value: 'workshop',
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'workshop', value: event.detail.state } }),
								}),
							],
						}),
						htmlTypeRadio = createElement('harmony-radio', {
							attributes: { multiple: 0 },
							childs: [
								createElement('button', {
									i18n: '#medals',
									value: 'medals',
									$change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displaymedals', event.detail.state),
								}),
								createElement('button', {
									i18n: '#weapons',
									value: 'weapons',
									$change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displayweapons', event.detail.state),
								}),
								createElement('button', {
									i18n: '#cosmetics',
									value: 'cosmetics',
									$change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displaycosmetics', event.detail.state),
								}),
								createElement('button', {
									i18n: '#taunts',
									value: 'taunts',
									$change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displaytaunts', event.detail.state),
								}),
							],
						}) as HTMLHarmonyRadioElement,
						createElement('harmony-radio', {
							attributes: { multiple: 0 },
							childs: [
								createElement('button', {
									i18n: '#one_class',
									value: 'one',
									attributes: { selected: '' },
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'showOneClass', value: event.detail.state } }),
								}),
								createElement('button', {
									i18n: '#multi_classes',
									value: 'multi',
									attributes: { selected: '' },
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'showMultiClass', value: event.detail.state } }),
								}),
								createElement('button', {
									i18n: '#all_classes',
									value: 'all',
									attributes: { selected: '' },
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'showAllClass', value: event.detail.state } }),
								})
							],
						}),
						createElement('harmony-switch', {
							class: 'large',
							'data-i18n': '#show_selected_items_only',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'selected', value: (event.target as HTMLHarmonySwitchElement).state } }),
						}),
						createElement('harmony-switch', {
							attributes: {
								ternary: true,
								state: undefined,
							},
							class: 'large',
							'data-i18n': '#hide_conflicting_items',
							state: undefined,
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'hideConflict', value: (event.target as HTMLHarmonySwitchElement).state } }),
						}),
						htmlSwitchFilterPerClass = createElement('harmony-switch', {
							class: 'large',
							'data-i18n': '#dont_filter_per_class',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'hideConflict', value: (event.target as HTMLHarmonySwitchElement).state } }),
						}) as HTMLHarmonySwitchElement,
						htmlShowHalloween = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_halloween_restricted_items',
							$change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.halloween', (event.target as HTMLHarmonySwitchElement).state),
						}) as HTMLHarmonySwitchElement,
						htmlShowPaintable = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_paintable_items',
							$change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.paintable', (event.target as HTMLHarmonySwitchElement).state),
						}) as HTMLHarmonySwitchElement,
						htmlShowWarpaintable = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_warpaintable_items',
							$change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.warpaintable', (event.target as HTMLHarmonySwitchElement).state),
						}) as HTMLHarmonySwitchElement,
					],
				}),
				createElement('div', {
					class: 'filter-misc-container',
					childs: [
						createElement('div', {
							class: 'filter3',
							childs: [
								this.#htmlSortType = createElement('select', {
									class: 'capitalize',
									childs: [
										createElement('option', { i18n: '#index', value: 'index' }),
										createElement('option', { i18n: '#name', value: 'name' }),
										createElement('option', { i18n: '#slot', value: 'slot' }),
									],
									$change: (event: Event) => OptionsManager.setItem('app.items.sort.type', (event.target as HTMLSelectElement).value),
								}) as HTMLSelectElement,
								this.#htmlFilterCollection = createElement('select', {
									class: 'capitalize',
									$change: (event: Event) => OptionsManager.setItem('app.items.filter.collection', (event.target as HTMLSelectElement).value),
								}) as HTMLSelectElement,
								htmlSortDirection = createElement('harmony-toggle-button', {
									childs: [
										createElement('div', {
											slot: 'on',
											innerHTML: sortAlphabeticalSVG,
										}),
										createElement('div', {
											slot: 'off',
											innerHTML: sortAlphabeticalReverseSVG,
										}),
									],
									$change: (event: Event) => OptionsManager.setItem('app.items.sort.ascending', (event.target as HTMLHarmonyToggleButtonElement).state),
								}) as HTMLHarmonyToggleButtonElement,
							]
						}),
					],
				}),
			]
		});

		this.#htmlNameFilterContainer = createElement('div', {
			class: 'line-name-filter',
			parent: shadowRoot,
			childs: [
				this.#filterInputDataList = createElement('datalist', {
					id: 'filter-input-datalist'
				}) as HTMLDataListElement,
				this.#htmlFilterInput = createElement('input', {
					class: 'filter-text',
					list: 'filter-input-datalist',
					$change: (event: Event) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'name', value: (event.target as HTMLInputElement).value } }),
					$keyup: (event: Event) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'name', value: (event.target as HTMLInputElement).value } }),
					$keydown: (event: Event) => event.stopPropagation(),
				}) as HTMLInputElement,
				htmlCollapsableFiltersButton = createElement('harmony-switch', {
					class: 'item-manager-display-filters width200px item-manager-display-filters-button',
					'data-i18n': '#display_filters',
					$change: (event: Event) => OptionsManager.setItem('app.items.displayfilters', (event.target as HTMLHarmonySwitchElement).state),
				}) as HTMLHarmonySwitchElement,
			],
		});

		OptionsManagerEvents.addEventListener('app.items.displayfilters', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlCollapsableFiltersButton.state = value as boolean; htmlCollapsableFiltersContainer.style.maxHeight = value ? '400px' : '0px' });

		this.#htmlItems = createElement('div', {
			class: 'items',
			parent: shadowRoot,
		});

		this.getShadowRoot().append(this.#presetsPanel.getHTMLElement());
	}

	#refreshItems(): void {
		// Ensure html is initialized
		this.getHTMLElement();
		this.#htmlItems!.replaceChildren();

		for (const item of ItemManager.getFilteredItems()) {

			createElement('item-manager-item', {
				properties: {
					item: item,
				},
				parent: this.#htmlItems,
				//$click: (event: Event) => (event.currentTarget == event.target) && this.#selectItem(item, event.target as ItemManagerItem)
			});
		}
	}
}
