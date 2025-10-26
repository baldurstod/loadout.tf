import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { sortAlphabeticalReverseSVG, sortAlphabeticalSVG } from 'harmony-svg';
import { createElement, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyToggleButton, HarmonySwitchChange, hide, HTMLHarmonyRadioElement, HTMLHarmonySwitchElement, HTMLHarmonyToggleButtonElement, show, toggle } from 'harmony-ui';
import itemCSS from '../../css/item.css';
import itemPanelCSS from '../../css/itempanel.css';
import { Controller, ControllerEvent, ItemFilterAttribute, SetItemFilter } from '../controller';
import { Panel } from '../enums';
import { Item } from '../loadout/items/item';
import { ItemManager } from '../loadout/items/itemmanager';
import { ItemTemplate } from '../loadout/items/itemtemplate';
import { DynamicPanel } from './dynamicpanel';
import { ItemManagerItem } from './itemmanageritem';
import { PresetsPanel } from './presetspanel';
export { ItemManagerItem } from './itemmanageritem';

export class ItemsPanel extends DynamicPanel {
	#htmlActiveItems?: HTMLElement;
	//#htmlFiltersContainer?: HTMLElement;
	#htmlNameFilterContainer?: HTMLElement;
	#htmlItemsContainer?: HTMLElement;
	#htmlSortType?: HTMLSelectElement;
	#filterInputDataList?: HTMLDataListElement;
	#htmlFilterCollection?: HTMLSelectElement;
	#htmlFilterInput?: HTMLInputElement;
	#presetsPanel = new PresetsPanel();
	#updatingPresets = false;
	#htmlItems = new Map<string, ItemManagerItem>();

	constructor() {
		super(Panel.Items, [itemPanelCSS, itemCSS]);
		hide(this.getShadowRoot());
		this.#initListeners();
	}


	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.ItemsLoaded, () => this.#refreshItems());
		Controller.addEventListener(ControllerEvent.FiltersUpdated, () => this.#refreshItems());
		Controller.addEventListener(ControllerEvent.ItemAdded, (event: Event) => this.#handleItemAddedRemoved((event as CustomEvent<Item>).detail, true));
		Controller.addEventListener(ControllerEvent.ItemRemoved, (event: Event) => this.#handleItemAddedRemoved((event as CustomEvent<Item>).detail, false));
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
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.TournamentMedals, value: event.detail.state } }),
								}),
								createElement('button', {
									'i18n': '#workshop',
									value: 'workshop',
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Workshop, value: event.detail.state } }),
								}),
							],
						}),
						htmlTypeRadio = createElement('harmony-radio', {
							attributes: { multiple: 0 },
							childs: [
								createElement('button', {
									i18n: '#medals',
									value: 'medals',
									$change: (event: CustomEvent) => {
										OptionsManager.setItem('app.items.filter.displaymedals', event.detail.state);
										Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.DisplayMedals, value: event.detail.state } });
									},
								}),
								createElement('button', {
									i18n: '#weapons',
									value: 'weapons',
									$change: (event: CustomEvent) => {
										OptionsManager.setItem('app.items.filter.displayweapons', event.detail.state);
										Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.DisplayWeapons, value: event.detail.state } });
									},
								}),
								createElement('button', {
									i18n: '#cosmetics',
									value: 'cosmetics',
									$change: (event: CustomEvent) => {
										OptionsManager.setItem('app.items.filter.displaycosmetics', event.detail.state);
										Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.DisplayCosmetics, value: event.detail.state } });
									},
								}),
								createElement('button', {
									i18n: '#taunts',
									value: 'taunts',
									$change: (event: CustomEvent) => {
										OptionsManager.setItem('app.items.filter.displaytaunts', event.detail.state);
										Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.DisplayTaunts, value: event.detail.state } });
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
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.ShowOneClass, value: event.detail.state } }),
								}),
								createElement('button', {
									i18n: '#multi_classes',
									value: 'multi',
									attributes: { selected: '' },
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.ShowMultiClass, value: event.detail.state } }),
								}),
								createElement('button', {
									i18n: '#all_classes',
									value: 'all',
									attributes: { selected: '' },
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.ShowAllClass, value: event.detail.state } }),
								})
							],
						}),
						createElement('harmony-switch', {
							class: 'large',
							'data-i18n': '#show_selected_items_only',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Selected, value: (event.target as HTMLHarmonySwitchElement).state } }),
						}),
						createElement('harmony-switch', {
							attributes: {
								ternary: true,
								state: undefined,
							},
							class: 'large',
							'data-i18n': '#hide_conflicting_items',
							state: undefined,
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.HideConflict, value: (event.target as HTMLHarmonySwitchElement).state } }),
						}),
						htmlSwitchFilterPerClass = createElement('harmony-switch', {
							class: 'large',
							'data-i18n': '#dont_filter_per_class',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.DoNotFilterPerClass, value: (event.target as HTMLHarmonySwitchElement).state } }),
						}) as HTMLHarmonySwitchElement,
						htmlShowHalloween = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_halloween_restricted_items',
							$change: (event: CustomEvent<HarmonySwitchChange>) => {
								OptionsManager.setItem('app.items.filter.halloween', event.detail.state);
								Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Halloween, value: event.detail.state } });
							},
						}) as HTMLHarmonySwitchElement,
						htmlShowPaintable = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_paintable_items',
							$change: (event: CustomEvent<HarmonySwitchChange>) => {
								OptionsManager.setItem('app.items.filter.paintable', (event.detail.state));
								Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Paintable, value: (event.target as HTMLHarmonySwitchElement).state } });
							},
						}) as HTMLHarmonySwitchElement,
						htmlShowWarpaintable = createElement('harmony-switch', {
							attributes: {
								ternary: true,
							},
							class: 'large',
							'data-i18n': '#show_warpaintable_items',
							$change: (event: CustomEvent) => {
								OptionsManager.setItem('app.items.filter.warpaintable', event.detail.state);
								Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Warpaintable, value: event.detail.state } });
							},
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
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.sort.type', (event.target as HTMLSelectElement).value);
										Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.DisplayTaunts, value: (event.target as HTMLSelectElement).value } });
									},
								}) as HTMLSelectElement,
								this.#htmlFilterCollection = createElement('select', {
									class: 'capitalize',
									//$change: (event: Event) => OptionsManager.setItem('app.items.filter.collection', (event.target as HTMLSelectElement).value),
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.filter.collection', (event.target as HTMLSelectElement).value);
										Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Collection, value: (event.target as HTMLSelectElement).value } });
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
									//$change: (event: Event) => OptionsManager.setItem('app.items.sort.ascending', (event.target as HTMLHarmonyToggleButtonElement).state),
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.sort.ascending', (event.target as HTMLSelectElement).value);
										//Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Collection, value: (event.target as HTMLSelectElement).value } });
									},
								}) as HTMLHarmonyToggleButtonElement,
							]
						}),
					],
				}),
			]
		});

		const setNameFilter = (name: string): void => {
			OptionsManager.setItem('app.items.filter.text', name);
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Name, value: name } });
		}

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
					$change: (event: Event) => setNameFilter((event.target as HTMLInputElement).value.toLowerCase().trim()),
					$keyup: (event: Event) => setNameFilter((event.target as HTMLInputElement).value.toLowerCase().trim()),
					$keydown: (event: Event) => event.stopPropagation(),
				}) as HTMLInputElement,
				htmlCollapsableFiltersButton = createElement('harmony-switch', {
					class: 'item-manager-display-filters width200px item-manager-display-filters-button',
					'data-i18n': '#display_filters',
					$change: (event: Event) => OptionsManager.setItem('app.items.displayfilters', (event.target as HTMLHarmonySwitchElement).state),
				}) as HTMLHarmonySwitchElement,
			],
		});


		this.#htmlItemsContainer = createElement('div', {
			class: 'items',
			parent: shadowRoot,
		});

		this.getShadowRoot().append(this.#presetsPanel.getHTMLElement());


		OptionsManagerEvents.addEventListener('app.items.displayfilters', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlCollapsableFiltersButton.state = value as boolean; htmlCollapsableFiltersContainer.style.maxHeight = value ? '400px' : '0px' });

		//OptionsManagerEvents.addEventListener('app.items.filter.restoretext', (event: Event) => { if ((event as CustomEvent<OptionsManagerEvent>).detail.value) { this.#htmlFilterInput!.value = OptionsManager.getItem('app.items.filter.text'); } });
		const populateName = (): void => {
			if (OptionsManager.getItem('app.items.filter.restoretext')) {
				this.#htmlFilterInput!.value = OptionsManager.getItem('app.items.filter.text');
			}
		};
		OptionsManagerEvents.addEventListener('app.items.filter.restoretext', () => populateName());
		OptionsManagerEvents.addEventListener('app.items.filter.text', () => populateName());

		OptionsManagerEvents.addEventListener('app.items.filter.displaymedals', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlTypeRadio.select('medals', value as boolean); /*this.#setFilterMedals(value); */ });
		OptionsManagerEvents.addEventListener('app.items.filter.displayweapons', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlTypeRadio.select('weapons', value as boolean); /*this.#setFilterWeapons(value);*/ });
		OptionsManagerEvents.addEventListener('app.items.filter.displaycosmetics', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlTypeRadio.select('cosmetics', value as boolean);/* this.#setFilterCosmetics(value);*/ });
		OptionsManagerEvents.addEventListener('app.items.filter.displaytaunts', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlTypeRadio.select('taunts', value as boolean); /*this.#setFilterTaunts(value); */ });

		OptionsManagerEvents.addEventListener('app.items.filter.filterallclass', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlSwitchFilterPerClass.state = value as boolean | undefined; /*this.#applyFilter();*/ });

		OptionsManagerEvents.addEventListener('app.items.sort.type', (event: Event) => this.#htmlSortType!.value = (event as CustomEvent<OptionsManagerEvent>).detail.value as string);

		OptionsManagerEvents.addEventListener('app.items.filter.collection', (event: Event) => this.#htmlFilterCollection!.value = (event as CustomEvent<OptionsManagerEvent>).detail.value as string);

		OptionsManagerEvents.addEventListener('app.items.sort.ascending', (event: Event) => htmlSortDirection.state = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		//OptionsManagerEvents.addEventListener('app.items.warpaints.sort.type', (event: Event) => this.#htmlWarpaintsSortType.value = (event as CustomEvent<OptionsManagerEvent>).detail.value);
		//OptionsManagerEvents.addEventListener('app.items.warpaints.sort.ascending', (event: Event) => this.#htmlWarpaintsSortDirection.state = ascending);

		OptionsManagerEvents.addEventListener('app.items.filter.halloween', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent>).detail.value; htmlShowHalloween.state = value as boolean | undefined; });
		OptionsManagerEvents.addEventListener('app.items.filter.paintable', (event: Event) => htmlShowPaintable.state = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean | undefined);
		OptionsManagerEvents.addEventListener('app.items.filter.warpaintable', (event: Event) => htmlShowWarpaintable.state = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean | undefined);
		//OptionsManagerEvents.addEventListener('app.items.filter.*', () => this.#refreshItems());
	}

	#refreshItems(): void {
		// Ensure html is initialized
		this.getHTMLElement();
		//this.#htmlItemsContainer!.replaceChildren();
		for (const [, htmlItem] of this.#htmlItems) {
			hide(htmlItem);
		}

		for (const [id, item] of ItemManager.getFilteredItems()) {
			let htmlItem = this.#htmlItems.get(id);
			if (htmlItem) {
				show(htmlItem);
				continue;
			}

			htmlItem = createElement('item-manager-item', {
				properties: {
					item: item,
				},
				parent: this.#htmlItemsContainer,
				$click: (event: Event) => {
					if (event.currentTarget == event.target) {
						Controller.dispatchEvent<ItemTemplate>(ControllerEvent.ItemClicked, { detail: item });
					}
				},
			}) as ItemManagerItem;

			this.#htmlItems.set(id, htmlItem);
		}
	}

	#handleItemAddedRemoved(item: Item, added: boolean): void {
		const htmlItem = this.#htmlItems.get(item.id);
		if (added) {
			htmlItem?.classList.add('item-selected');
		} else {
			htmlItem?.classList.remove('item-selected');
		}
	}
}
