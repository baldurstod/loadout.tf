import { Repository } from 'harmony-3d';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents, ShortcutHandler } from 'harmony-browser-utils';
import { sortAlphabeticalReverseSVG, sortAlphabeticalSVG } from 'harmony-svg';
import { createElement, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyToggleButton, display, HarmonySwitchChange, hide, HTMLHarmonyRadioElement, HTMLHarmonySwitchElement, HTMLHarmonyToggleButtonElement, I18n, show, toggle } from 'harmony-ui';
import itemCSS from '../../css/item.css';
import itemPanelCSS from '../../css/itempanel.css';
import { inventoryPath } from '../constants';
import { Controller, ControllerEvent, ItemFilterAttribute, SetItemFilter } from '../controller';
import { Panel } from '../enums';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Tf2Class } from '../loadout/characters/characters';
import { Item } from '../loadout/items/item';
import { ItemManager } from '../loadout/items/itemmanager';
import { ItemTemplate } from '../loadout/items/itemtemplate';
import { SfmItemRepository } from '../repositories/sfmitemrepository';
import { DynamicPanel } from './dynamicpanel';
import { ItemManagerItem } from './itemmanageritem';
import { PaintPanel } from './paintpanel';
import { PresetsPanel } from './presetspanel';
import { RepositoriesPanel } from './repositoriespanel';
import { SheenPanel } from './sheenpanel';
import { WarpaintPanel } from './warpaintpanel';
import { WeaponEffectPanel } from './weaponeffectpanel';
export { ItemManagerItem } from './itemmanageritem';

export class ItemsPanel extends DynamicPanel {
	#htmlActiveItems?: HTMLElement;
	//#htmlFiltersContainer?: HTMLElement;
	#htmlNameFilterContainer?: HTMLElement;
	#htmlItemsContainer?: HTMLElement;
	#htmlItemsContainerSpacer?: HTMLElement;
	//#htmlSortType?: HTMLSelectElement;
	#filterInputDataList?: HTMLDataListElement;
	#htmlFilterCollection?: HTMLSelectElement;
	#htmlFilterInput?: HTMLInputElement;
	#htmlConflictingItems?: HTMLElement;
	#htmlExcludedItems?: HTMLElement;
	#htmlWorkshopInfo?: HTMLElement;
	#presetsPanel = new PresetsPanel();
	#paintPanel = new PaintPanel();
	#sheenPanel = new SheenPanel();
	#repositoriesPanel = new RepositoriesPanel();
	#weaponEffectPanel = new WeaponEffectPanel();
	#warpaintPanel = new WarpaintPanel();
	#updatingPresets = false;
	#htmlItems = new Map<string, ItemManagerItem>();
	#htmlCollapsableFiltersContainer?: HTMLElement;

	constructor() {
		super(Panel.Items, [itemPanelCSS, itemCSS]);
		hide(this.getShadowRoot());
		this.#initListeners();
	}

	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.ItemsLoaded, () => this.#refreshItems());
		Controller.addEventListener(ControllerEvent.SfmItemsLoaded, () => this.#refreshItems());
		Controller.addEventListener(ControllerEvent.FiltersUpdated, () => this.#refreshItems());
		Controller.addEventListener(ControllerEvent.SetItemFilter, (event: Event) => this.#setItemFilter((event as CustomEvent<SetItemFilter>).detail));
		Controller.addEventListener(ControllerEvent.ItemAdded, (event: Event) => this.#handleItemAddedRemoved((event as CustomEvent<Item>).detail, true));
		Controller.addEventListener(ControllerEvent.ItemRemoved, (event: Event) => this.#handleItemAddedRemoved((event as CustomEvent<Item>).detail, false));
		Controller.addEventListener(ControllerEvent.PaintClick, (event: Event) => this.#handlePaintClick((event as CustomEvent<ItemTemplate>).detail));
		Controller.addEventListener(ControllerEvent.SheenClick, (event: Event) => this.#handleSheenClick((event as CustomEvent<ItemTemplate>).detail));
		Controller.addEventListener(ControllerEvent.WeaponEffectClick, (event: Event) => this.#handleWeaponEffectClick((event as CustomEvent<ItemTemplate>).detail));
		Controller.addEventListener(ControllerEvent.WarpaintClick, (event: Event) => this.#handleWarpaintClick((event as CustomEvent<ItemTemplate>).detail));
		Controller.addEventListener(ControllerEvent.RepositoryAdded, (event: Event) => this.#handleRepositoryAdded((event as CustomEvent<Repository>).detail));

		OptionsManagerEvents.addEventListener('app.css.variables.item-manager-item-size', () => this.#refreshItems());
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
		let htmlSortType: HTMLSelectElement;
		let htmlSfmSortType: HTMLSelectElement;
		let htmlSfmUniverse: HTMLSelectElement;
		let htmlSfmModel: HTMLSelectElement;
		let htmlSortDirection: HTMLHarmonyToggleButtonElement;
		let htmlSfmSortDirection: HTMLHarmonyToggleButtonElement;
		let htmlShowWarpaintable: HTMLHarmonySwitchElement;
		let htmlCollapsableFiltersButton: HTMLHarmonySwitchElement;

		this.#htmlCollapsableFiltersContainer = createElement('div', {
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
									$change: (event: CustomEvent) => this.#setWorkshopFilter(event.detail.state),
								}),
								createElement('button', {
									'i18n': '#sfm',
									value: 'sfm_workshop',
									$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.SfmWorkshop, value: event.detail.state } }),
								}),
							],
						}),
						htmlTypeRadio = createElement('harmony-radio', {
							class: 'no-sfm-filter',
							attributes: { multiple: '1' },
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
							class: 'no-sfm-filter',
							attributes: { multiple: '1' },
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
							class: 'large no-sfm-filter',
							'data-i18n': '#show_selected_items_only',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Selected, value: (event.target as HTMLHarmonySwitchElement).state } }),
						}),
						createElement('harmony-switch', {
							attributes: {
								ternary: 'true',
								state: 'undefined',
							},
							class: 'large no-sfm-filter',
							'data-i18n': '#hide_conflicting_items',
							state: undefined,
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.HideConflict, value: (event.target as HTMLHarmonySwitchElement).state } }),
						}),
						htmlSwitchFilterPerClass = createElement('harmony-switch', {
							class: 'large no-sfm-filter',
							'data-i18n': '#dont_filter_per_class',
							$change: (event: CustomEvent) => Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.DoNotFilterPerClass, value: (event.target as HTMLHarmonySwitchElement).state } }),
						}) as HTMLHarmonySwitchElement,
						htmlShowHalloween = createElement('harmony-switch', {
							attributes: {
								ternary: 'true',
							},
							class: 'large no-sfm-filter',
							'data-i18n': '#show_halloween_restricted_items',
							$change: (event: CustomEvent<HarmonySwitchChange>) => {
								OptionsManager.setItem('app.items.filter.halloween', event.detail.state);
								Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Halloween, value: event.detail.state } });
							},
						}) as HTMLHarmonySwitchElement,
						htmlShowPaintable = createElement('harmony-switch', {
							attributes: {
								ternary: 'true',
							},
							class: 'large no-sfm-filter',
							'data-i18n': '#show_paintable_items',
							$change: (event: CustomEvent<HarmonySwitchChange>) => {
								OptionsManager.setItem('app.items.filter.paintable', (event.detail.state));
								Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Paintable, value: (event.target as HTMLHarmonySwitchElement).state } });
							},
						}) as HTMLHarmonySwitchElement,
						htmlShowWarpaintable = createElement('harmony-switch', {
							attributes: {
								ternary: 'true',
							},
							class: 'large no-sfm-filter',
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
								htmlSortType = createElement('select', {
									class: 'capitalize no-sfm-filter',
									childs: [
										createElement('option', { i18n: '#index', value: 'index' }),
										createElement('option', { i18n: '#name', value: 'name' }),
										createElement('option', { i18n: '#slot', value: 'slot' }),
									],
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.sort.type', (event.target as HTMLSelectElement).value);
									},
								}) as HTMLSelectElement,
								htmlSfmSortType = createElement('select', {
									class: 'capitalize sfm-filter',
									hidden: true,
									childs: [
										createElement('option', { i18n: '#index', value: 'index' }),
										createElement('option', { i18n: '#name', value: 'name' }),
										createElement('option', { i18n: '#subscriptions', value: 'subscriptions' }),
										createElement('option', { i18n: '#date_updated', value: 'updated' }),
										createElement('option', { i18n: '#date_created', value: 'created' }),
										createElement('option', { i18n: '#random', value: 'random' }),
									],
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.sfm.sort.field', (event.target as HTMLSelectElement).value);
									},
								}) as HTMLSelectElement,
								htmlSfmUniverse = createElement('select', {
									class: 'capitalize sfm-filter',
									hidden: true,
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.filter.sfm.universe', (event.target as HTMLSelectElement).value);
									},
								}) as HTMLSelectElement,
								htmlSfmModel = createElement('select', {
									class: 'capitalize sfm-filter',
									hidden: true,
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.filter.sfm.models', (event.target as HTMLSelectElement).value);
									},
								}) as HTMLSelectElement,
								this.#htmlFilterCollection = createElement('select', {
									class: 'capitalize no-sfm-filter',
									$change: (event: Event) => OptionsManager.setItem('app.items.filter.collection', (event.target as HTMLSelectElement).value),
								}) as HTMLSelectElement,
								htmlSortDirection = createElement('harmony-toggle-button', {
									class: 'no-sfm-filter',
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
									$change: (event: Event) => {
										OptionsManager.setItem('app.items.sort.ascending', (event.target as HTMLHarmonyToggleButtonElement).state);
									},
								}) as HTMLHarmonyToggleButtonElement,
								htmlSfmSortDirection = createElement('harmony-toggle-button', {
									class: 'sfm-filter',
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
									$change: (event: Event) => OptionsManager.setItem('app.items.sfm.sort.ascending', (event.target as HTMLHarmonyToggleButtonElement).state),
								}) as HTMLHarmonyToggleButtonElement,
							]
						}),
					],
				}),
			]
		});

		function fillSelect(optionName: string, select: HTMLSelectElement): void {
			OptionsManager.getList(optionName).then(universeList => {
				if (universeList) {
					select.innerText = '';
					for (let currency of universeList) {
						createElement('option', {
							parent: select,
							innerText: String(currency),
						})
					}
					select.value = OptionsManager.getItem(optionName) as string;
				}
			});
		}

		fillSelect('app.items.filter.sfm.universe', htmlSfmUniverse);
		fillSelect('app.items.filter.sfm.models', htmlSfmModel);

		const setNameFilter = (name: string): void => {
			OptionsManager.setItem('app.items.filter.text', name);
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Name, value: name.toLowerCase().trim() } });
		}

		const setCollectionFilter = (collection: string): void => {
			OptionsManager.setItem('app.items.filter.collection', collection);
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Collection, value: collection } });
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
					$change: (event: Event) => setNameFilter((event.target as HTMLInputElement).value),
					$keyup: (event: Event) => setNameFilter((event.target as HTMLInputElement).value),
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
			attributes: {
				tabindex: '1',
			},
			child: this.#htmlItemsContainerSpacer = createElement('div', { style: "width:10000rem", }),// This element force items to use as much width as they can
		});
		this.#htmlItemsContainer.addEventListener('scroll', () => this.#handleItemsScroll(), { passive: true });

		ShortcutHandler.addContext('loadout', this.#htmlItemsContainer);
		new ResizeObserver(() => this.#refreshItems()).observe(this.#htmlItemsContainer);

		this.#htmlConflictingItems = createElement('div', {
			class: 'conflicting-items',
			parent: shadowRoot,
			i18n: '#interfere_warning',
			hidden: true,
		});
		this.#htmlExcludedItems = createElement('div', {
			class: 'excluded-items',
			parent: shadowRoot,
			i18n: '#items_excluded',
			hidden: true,
		});
		this.#htmlWorkshopInfo = createElement('div', {
			class: 'workshop-info',
			parent: shadowRoot,
			i18n: {
				innerHTML: '#workshop_info'
			},
			hidden: true,
		});
		//this.#htmlItemSelectorPanelInterfere = createElement('div', { class: 'item-manager-interfere', i18n: '#interfere_warning', hidden: true }),

		this.getShadowRoot().append(
			this.#presetsPanel.getHTMLElement(),
			this.#paintPanel.getHTMLElement(),
			this.#sheenPanel.getHTMLElement(),
			this.#repositoriesPanel.getHTMLElement(),
			this.#weaponEffectPanel.getHTMLElement(),
			this.#warpaintPanel.getHTMLElement(),
		);

		OptionsManagerEvents.addEventListener('app.items.displayfilters', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value; htmlCollapsableFiltersButton.state = value as boolean; this.#htmlCollapsableFiltersContainer!.style.maxHeight = value ? '400px' : '0px' });

		//OptionsManagerEvents.addEventListener('app.items.filter.restoretext', (event: Event) => { if ((event as CustomEvent<OptionsManagerEvent<string>>).detail.value) { this.#htmlFilterInput!.value = OptionsManager.getItem('app.items.filter.text'); } });
		const populateName = (): void => {
			if (OptionsManager.getItem('app.items.filter.restoretext')) {
				const textFilter = OptionsManager.getItem('app.items.filter.text') as string;
				this.#htmlFilterInput!.value = textFilter;
				setNameFilter(textFilter);
			}
		};
		OptionsManagerEvents.addEventListener('app.items.filter.restoretext', () => populateName());
		OptionsManagerEvents.addEventListener('app.items.filter.text', () => populateName());

		OptionsManagerEvents.addEventListener('app.items.filter.displaymedals', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value; htmlTypeRadio.select('medals', value as boolean); /*this.#setFilterMedals(value); */ });
		OptionsManagerEvents.addEventListener('app.items.filter.displayweapons', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value; htmlTypeRadio.select('weapons', value as boolean); /*this.#setFilterWeapons(value);*/ });
		OptionsManagerEvents.addEventListener('app.items.filter.displaycosmetics', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value; htmlTypeRadio.select('cosmetics', value as boolean);/* this.#setFilterCosmetics(value);*/ });
		OptionsManagerEvents.addEventListener('app.items.filter.displaytaunts', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value; htmlTypeRadio.select('taunts', value as boolean); /*this.#setFilterTaunts(value); */ });

		OptionsManagerEvents.addEventListener('app.items.filter.filterallclass', (event: Event) => { const value = (event as CustomEvent<OptionsManagerEvent<boolean | undefined>>).detail.value; htmlSwitchFilterPerClass.state = value as boolean | undefined; /*this.#applyFilter();*/ });

		//OptionsManagerEvents.addEventListener('app.items.sort.type', (event: Event) => this.#htmlSortType!.value = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string);
		OptionsManagerEvents.addEventListener('app.items.sort.type', (event: Event) => {
			const sortType = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string;
			htmlSortType.value = sortType;
			Controller.dispatchEvent<string>(ControllerEvent.SetItemSortType, { detail: sortType });
			this.#refreshItems();
		});

		OptionsManagerEvents.addEventListener('app.items.filter.sfm.universe', (event: Event) => {
			const universe = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string;
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.SfmUniverse, value: universe } }),
				this.#refreshItems();
		});

		OptionsManagerEvents.addEventListener('app.items.filter.sfm.models', (event: Event) => {
			const models = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string;
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.SfmModel, value: models } }),
				this.#refreshItems();
		});

		OptionsManagerEvents.addEventListener('app.items.sfm.sort.field', (event: Event) => {
			const sortType = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string;
			htmlSfmSortType.value = sortType;
			Controller.dispatchEvent<string>(ControllerEvent.SetSfmSortField, { detail: sortType });
			this.#refreshItems();
		});

		OptionsManagerEvents.addEventListener('app.items.filter.collection', (event: Event) => {
			const collectionFilter = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value as string;
			this.#htmlFilterCollection!.value = collectionFilter;
			setCollectionFilter(collectionFilter);
		});
		OptionsManagerEvents.addEventListener('app.items.filter.collection.sort.type', () => this.#refreshItems());

		OptionsManagerEvents.addEventListener('app.items.sort.ascending', (event: Event) => {
			const ascending = (event as CustomEvent).detail.value;
			htmlSortDirection.state = ascending;
			Controller.dispatchEvent<boolean>(ControllerEvent.SetItemSortAscending, { detail: ascending });
			this.#refreshItems();
		});

		OptionsManagerEvents.addEventListener('app.items.sfm.sort.ascending', (event: Event) => {
			const ascending = (event as CustomEvent).detail.value;
			htmlSfmSortDirection.state = ascending;
			Controller.dispatchEvent<boolean>(ControllerEvent.SetSfmItemSortAscending, { detail: ascending });
			this.#refreshItems();
		});

		//OptionsManagerEvents.addEventListener('app.items.warpaints.sort.type', (event: Event) => this.#htmlWarpaintsSortType.value = (event as CustomEvent<OptionsManagerEvent<string>>).detail.value);
		//OptionsManagerEvents.addEventListener('app.items.warpaints.sort.ascending', (event: Event) => this.#htmlWarpaintsSortDirection.state = ascending);

		OptionsManagerEvents.addEventListener('app.items.filter.halloween', (event: Event) => {
			htmlShowHalloween.state = (event as CustomEvent<OptionsManagerEvent<boolean | undefined>>).detail.value as boolean | undefined;
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Halloween, value: htmlShowHalloween.state = (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value as boolean } });
		});
		OptionsManagerEvents.addEventListener('app.items.filter.paintable', (event: Event) => {
			htmlShowPaintable.state = (event as CustomEvent<OptionsManagerEvent<boolean | undefined>>).detail.value as boolean | undefined;
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Paintable, value: (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value as boolean } });
		});
		OptionsManagerEvents.addEventListener('app.items.filter.warpaintable', (event: Event) => {
			htmlShowWarpaintable.state = (event as CustomEvent<OptionsManagerEvent<boolean | undefined>>).detail.value as boolean | undefined;
			Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Warpaintable, value: (event as CustomEvent<OptionsManagerEvent<boolean>>).detail.value as boolean } });
		});
		//OptionsManagerEvents.addEventListener('app.items.filter.*', () => this.#refreshItems());
	}

	#refreshItems(): void {
		// Ensure html is initialized
		this.getHTMLElement();
		//this.#htmlItemsContainer!.replaceChildren();
		for (const [, htmlItem] of this.#htmlItems) {
			hide(htmlItem);
		}

		const selectedItems = ItemManager.getSelectedItems();
		const excludedItems = { e: 0 };
		const [items, conflictingItems] = ItemManager.getFilteredItems(excludedItems);

		const w = this.#htmlItemsContainer!.clientWidth;
		let elementSize = OptionsManager.getItem('app.css.variables.item-manager-item-size') as number ?? 150;
		const columns = w / elementSize;
		const offset = (columns % 1) * elementSize / 2;

		let row = 0;
		let column = 0;
		for (const [id, item] of items) {
			let htmlItem = this.#htmlItems.get(id);
			if (htmlItem) {
				//this.#htmlItemsContainer?.append(htmlItem);
				show(htmlItem);
			} else {
				htmlItem = createElement('item-manager-item', {
					properties: {
						item: item,
					},
					//parent: this.#htmlItemsContainer,
					$click: (event: Event) => {
						if (event.currentTarget == event.target) {
							Controller.dispatchEvent<ItemTemplate>(ControllerEvent.ItemClicked, { detail: item });
						}
					},
				}) as ItemManagerItem;

				this.#htmlItems.set(id, htmlItem);
			}
			htmlItem?.classList.remove('conflicting');

			htmlItem.style.position = 'absolute';
			htmlItem.top = row * elementSize;
			htmlItem.left = column * elementSize + offset;
			htmlItem.style.top = `${htmlItem.top}px`;
			htmlItem.style.left = `${htmlItem.left}px`;

			if (selectedItems.has(id)) {
				htmlItem?.classList.add('item-selected');
			} else {
				htmlItem?.classList.remove('item-selected');
				if (conflictingItems.has(id)) {
					htmlItem?.classList.add('conflicting');
				}
			}

			++column;
			if (column + 1 > columns) {
				column = 0;
				++row;
			}
		}

		this.#htmlItemsContainerSpacer!.style.height = `${row * elementSize + 200}px`;


		this.#refreshActiveListAndConflicts();
		this.#updateFilters();
		this.#setFilteredItems(excludedItems.e);
	}

	#setItemFilter(filter: SetItemFilter): void {
		if (filter.attribute == ItemFilterAttribute.SfmWorkshop && this.#htmlCollapsableFiltersContainer) {
			for (const elem of this.#htmlCollapsableFiltersContainer?.getElementsByClassName('no-sfm-filter')) {
				display(elem as HTMLElement, !(filter.value as boolean));
			}
			for (const elem of this.#htmlCollapsableFiltersContainer?.getElementsByClassName('sfm-filter')) {
				display(elem as HTMLElement, (filter.value as boolean));
			}
		}
	}

	#refreshActiveListAndConflicts(): void {
		const selectedItems = ItemManager.getSelectedItems();
		const conflictingItems = ItemManager.getConflictingItems();

		// Set conficting for the item list
		for (const [id, htmlItem] of this.#htmlItems) {
			if (conflictingItems.has(id)) {
				htmlItem?.classList.add('item-interfere');
			} else {
				htmlItem?.classList.remove('item-interfere');
			}
		}

		if (conflictingItems.size > 0) {
			show(this.#htmlConflictingItems);
		} else {
			hide(this.#htmlConflictingItems);
		}

		// Add active items icons
		this.#htmlActiveItems?.replaceChildren();
		for (const selectedItemId of selectedItems) {
			const template = ItemManager.getItemTemplate(selectedItemId);
			if (template) {

				const imageInventory = template.imageInventory;
				let src = '';
				if (imageInventory) {
					if (imageInventory && imageInventory.startsWith('http')) {
						src = imageInventory;
					} else {
						src = inventoryPath + imageInventory.toLowerCase() + '.png';
					}
				}

				const htmlActiveItem = createElement('img', {
					class: 'active-item',
					parent: this.#htmlActiveItems,
					src: src,
					$click: () => Controller.dispatchEvent<ItemTemplate>(ControllerEvent.ItemClicked, { detail: template }),
				});

				if (conflictingItems.has(selectedItemId)) {
					htmlActiveItem?.classList.add('item-interfere');
				} else {
					htmlActiveItem?.classList.remove('item-interfere');
				}

			}
		}
	}

	#handleItemAddedRemoved(item: Item, added: boolean): void {
		const htmlItem = this.#htmlItems.get(item.id);
		if (added) {
			htmlItem?.classList.add('item-selected');
		} else {
			htmlItem?.classList.remove('item-selected');
		}
		this.#refreshActiveListAndConflicts();
	}

	#handlePaintClick(template: ItemTemplate): void {
		/*
		const htmlItem = this.#htmlItems.get(item.id);
		if (added) {
			htmlItem?.classList.add('item-selected');
		} else {
			htmlItem?.classList.remove('item-selected');
		}
		this.#refreshActiveListAndConflicts();
		*/
		//show(this.#paintPanel.getHTMLElement());
		const character = CharacterManager.getCurrentCharacter();
		if (!character) {
			return;
		}
		const item = character.getItemById(template.id);
		if (item) {
			this.#paintPanel.selectPaint(item);
		}
	}

	#handleSheenClick(template: ItemTemplate): void {
		const character = CharacterManager.getCurrentCharacter();
		if (!character) {
			return;
		}
		const item = character.getItemById(template.id);
		if (item) {
			this.#sheenPanel.selectSheen(item);
		}
	}

	#handleWeaponEffectClick(template: ItemTemplate): void {
		const character = CharacterManager.getCurrentCharacter();
		if (!character) {
			return;
		}
		const item = character.getItemById(template.id);
		if (item) {
			this.#weaponEffectPanel.selectEffect(item);
		}
	}

	#handleWarpaintClick(template: ItemTemplate): void {
		Controller.dispatchEvent<void>(ControllerEvent.InitWarpaints);
		const character = CharacterManager.getCurrentCharacter();
		if (!character) {
			return;
		}

		if (character.characterClass == Tf2Class.CompareWarpaints) {
			const items: Item[] = [];
			for (const [, item] of character.items) {
				items.push(item);
			}
			this.#warpaintPanel.selectWarpaint(items);
		} else {
			const item = character.getItemById(template.id);
			if (item) {
				this.#warpaintPanel.selectWarpaint([item]);
			}
		}
	}

	#handleRepositoryAdded(repository: Repository): void {
		if (repository instanceof SfmItemRepository) {
			this.#repositoriesPanel.addRepository(repository);
		}
	}

	#updateFilters(): void {
		const collections = ItemManager.getCollections();

		const sortType = OptionsManager.getItem('app.items.filter.collection.sort.type') as string;
		switch (sortType) {
			case 'name':
				collections[Symbol.iterator] = function* (): SetIterator<string> {
					yield* [...this.keys()].sort(
						(a, b) => {
							return a < b ? -1 : 1;
						}
					);
				}
				break;
			default:
				break;
		}

		this.#htmlFilterCollection?.replaceChildren();
		createElement('option', { value: '', innerText: '', parent: this.#htmlFilterCollection });
		for (const collection of collections) {
			createElement('option', { value: collection, innerText: collection, parent: this.#htmlFilterCollection });
		}
		this.#htmlFilterCollection!.value = OptionsManager.getItem('app.items.filter.collection') as string;
		this.#handleItemsScroll();
	}

	#setFilteredItems(excludedItems: number): void {
		display(this.#htmlExcludedItems, excludedItems > 0 && OptionsManager.getItem('app.items.filter.displayexcludedcount') as boolean);
		I18n.setValue(this.#htmlExcludedItems, 'count', excludedItems);
	}

	#setWorkshopFilter(workshop: boolean): void {
		Controller.dispatchEvent<SetItemFilter>(ControllerEvent.SetItemFilter, { detail: { attribute: ItemFilterAttribute.Workshop, value: workshop } })
		if (workshop) {
			show(this.#htmlWorkshopInfo);
		} else {
			hide(this.#htmlWorkshopInfo);
		}
	}

	#handleItemsScroll(): void {
		const scrollTop = this.#htmlItemsContainer!.scrollTop;

		for (const [, item] of this.#htmlItems) {
			if (item.top + 200 > scrollTop && item.top < scrollTop + this.#htmlItemsContainer!.clientHeight) {
				this.#htmlItemsContainer!.append(item);
				item.hideDetail();
			} else {
				item.remove();
			}
		}
	}
}
