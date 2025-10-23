import { createElement, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyToggleButton, hide, HTMLHarmonyRadioElement, HTMLHarmonySwitchElement, HTMLHarmonyToggleButtonElement, toggle } from 'harmony-ui';
import itemsCSS from '../../css/items.css';
import { Panel } from '../enums';
import { DynamicPanel } from './dynamicpanel';
import { PresetsPanel } from './presetspanel';
import { Controller, ControllerEvent, SetItemFilter } from '../controller';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { sortAlphabeticalReverseSVG, sortAlphabeticalSVG } from 'harmony-svg';

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
		super(Panel.Items, [itemsCSS]);
		hide(this.getShadowRoot());
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
									events: {
										change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displaymedals', event.detail.state),
									},
								}),
								createElement('button', {
									i18n: '#weapons',
									value: 'weapons',
									events: {
										change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displayweapons', event.detail.state),
									},
								}),
								createElement('button', {
									i18n: '#cosmetics',
									value: 'cosmetics',
									events: {
										change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displaycosmetics', event.detail.state),
									},

								}),
								createElement('button', {
									i18n: '#taunts',
									value: 'taunts',
									events: {
										change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.displaytaunts', event.detail.state),
									},

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
									/*
									events: {
										change: (event: CustomEvent) => { this.#filters.showOneClass = event.detail.state; this.#applyFilter(); },
									}
									*/
								}),
								createElement('button', {
									i18n: '#multi_classes',
									value: 'multi',
									attributes: { selected: '' },
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'showMultiClass', value: event.detail.state } }),
									/*
									events: {
										change: (event: CustomEvent) => { this.#filters.showMultiClass = event.detail.state; this.#applyFilter(); },
									},
									*/
								}),
								createElement('button', {
									i18n: '#all_classes',
									value: 'all',
									attributes: { selected: '' },
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'showAllClass', value: event.detail.state } }),
									/*
									events: {
										change: (event: CustomEvent) => { this.#filters.showAllClass = event.detail.state; this.#applyFilter(); },
									},
									*/
								})
							],
						}),
						createElement('harmony-switch', {
							class: 'large',
							'data-i18n': '#show_selected_items_only',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'selected', value: (event.target as HTMLHarmonySwitchElement).state } }),
							/*
							events: {
								change: (event: CustomEvent) => this.#setFilterSelected((event.target as HTMLHarmonySwitchElement).state ?? false),
							},
							*/
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
							/*
							events: {
								change: (event: CustomEvent) => { this.#filters.hideConflict = (event.target as HTMLHarmonySwitchElement).state; this.#applyFilter(); },
							},
							*/
						}),
						htmlSwitchFilterPerClass = createElement('harmony-switch', {
							class: 'large',
							'data-i18n': '#dont_filter_per_class',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { name: 'hideConflict', value: (event.target as HTMLHarmonySwitchElement).state } }),
							/*
							events: {
								change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.filterallclass', (event.target as HTMLHarmonySwitchElement).state),
							},
							*/
						}) as HTMLHarmonySwitchElement,
						htmlShowHalloween = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_halloween_restricted_items',
							events: {
								change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.halloween', (event.target as HTMLHarmonySwitchElement).state)
							}
						}) as HTMLHarmonySwitchElement,
						htmlShowPaintable = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_paintable_items',
							events: {
								change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.paintable', (event.target as HTMLHarmonySwitchElement).state)
							}
						}) as HTMLHarmonySwitchElement,
						htmlShowWarpaintable = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_warpaintable_items',
							events: {
								change: (event: CustomEvent) => OptionsManager.setItem('app.items.filter.warpaintable', (event.target as HTMLHarmonySwitchElement).state)
							}
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
									events: {
										change: (event: Event) => OptionsManager.setItem('app.items.sort.type', (event.target as HTMLSelectElement).value),
									}
								}) as HTMLSelectElement,
								this.#htmlFilterCollection = createElement('select', {
									class: 'capitalize',
									events: {
										change: (event: Event) => OptionsManager.setItem('app.items.filter.collection', (event.target as HTMLSelectElement).value),
									},
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
									events: {
										change: (event: Event) => OptionsManager.setItem('app.items.sort.ascending', (event.target as HTMLHarmonyToggleButtonElement).state),
									},
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
					events: {
						change: (event: Event) => OptionsManager.setItem('app.items.displayfilters', (event.target as HTMLHarmonySwitchElement).state)
					}
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
}
