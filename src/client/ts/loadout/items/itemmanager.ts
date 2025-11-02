import { WeaponManager, WeaponManagerEvents } from 'harmony-3d-utils';
import { OptionsManager } from 'harmony-browser-utils';
import { setLegacyPaintKit } from 'harmony-tf2-utils';
import { JSONObject } from 'harmony-types';
import { Map2 } from 'harmony-utils';
import { TF2_REPOSITORY, WORKSHOP_URL } from '../../constants';
import { Controller, ControllerEvent, ItemFilterAttribute, ItemPinned, SetItemFilter } from '../../controller';
import { Panel } from '../../enums';
import { Character } from '../characters/character';
import { Effect } from '../effects/effect';
import { EffectTemplate, EffectType } from '../effects/effecttemplate';
import { Item } from './item';
import { ItemFilter, ItemFilterResult } from './itemfilter';
import { ItemTemplate } from './itemtemplate';

export class ItemManager {
	static readonly #filters = new ItemFilter();
	static #currentCharacter: Character | null = null;
	//static #characterClass: Tf2Class | null = null;
	static #lang = 'english';
	static readonly #itemTemplates = new Map<string, ItemTemplate>();
	static readonly #effectTemplates = new Map2<EffectType, number, EffectTemplate>();
	static #loadItemsPromise?: Promise<void>;
	static #initMedalsPromise?: Promise<void>;
	static #initWorkshopPromise?: Promise<void>;
	static readonly #itemCollections = new Set<string>();
	static readonly #equipRegions = new Set<string>();
	static #sortingDirection = 1;

	static {
		this.#initListeners();
		this.#setSortingType('index');
	}

	static setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
		Controller.dispatchEvent<void>(ControllerEvent.FiltersUpdated);
	}

	/*
	static setCharacterClass(characterClass: Tf2Class): void {
		this.#characterClass = characterClass;
		Controller.dispatchEvent<void>(ControllerEvent.FiltersUpdated);
	}
	*/

	static setLang(lang: string): void {
		this.#lang = lang;
	}

	static #initListeners(): void {
		Controller.addEventListener(ControllerEvent.SetItemFilter, (event: Event) => this.#setItemFilter((event as CustomEvent<SetItemFilter>).detail));
		Controller.addEventListener(ControllerEvent.SetItemSortAscending, (event: Event) => this.#sortingDirection = (event as CustomEvent<boolean>).detail ? 1 : -1);
		Controller.addEventListener(ControllerEvent.SetItemSortType, (event: Event) => this.#setSortingType((event as CustomEvent<string>).detail));

		Controller.addEventListener(ControllerEvent.ItemPinned, (event: Event) => this.#pinItem((event as CustomEvent<ItemPinned>).detail.item, (event as CustomEvent<ItemPinned>).detail.pinned));
		//Controller.addEventListener(ControllerEvent.ItemClicked, (event: Event) => this.#handleItemClicked((event as CustomEvent<ItemTemplate>).detail));

		Controller.addEventListener(ControllerEvent.ShowPanel, (event: Event) => {
			if ((event as CustomEvent<Panel>).detail == Panel.Items || (event as CustomEvent<Panel>).detail == Panel.Effects) {
				this.#initItems();
			}
		});

		WeaponManager.addEventListener(WeaponManagerEvents.AddPaintKit, (event: Event) => {
			const detail = (event as CustomEvent).detail;
			this.#addWarpaint(String(detail.p1), String(detail.p2), detail.p3, detail.p4);
		});
	}

	static #setItemFilter(filter: SetItemFilter): void {
		this.#filters.setAttribute(filter.attribute, filter.value);
		Controller.dispatchEvent<void>(ControllerEvent.FiltersUpdated);

		if (filter.attribute == ItemFilterAttribute.Workshop) {
			this.initWorkshopItems();
		}

		if (filter.attribute == ItemFilterAttribute.TournamentMedals) {
			this.initTournamentMedals();
		}
	}

	static getItems(): Map<string, ItemTemplate> {
		return new Map<string, ItemTemplate>(this.#itemTemplates);
	}

	static getItemTemplate(id: string): ItemTemplate | null {
		return this.#itemTemplates.get(id) ?? null;
	}

	static getEffectTemplate(type: EffectType, id: number): EffectTemplate | null {
		return this.#effectTemplates.get(type, id) ?? null;
	}

	static getFilteredItems(excluded: { e: number }/*TODO: find a better way to do that*/): Map<string, ItemTemplate> {
		const filteredItems = new Map<string, ItemTemplate>();
		excluded.e = 0;

		for (const [id, itemTemplate] of this.#itemTemplates) {
			const match = this.#filters.matchFilter(itemTemplate, excluded, this.#currentCharacter?.characterClass ?? null, new Set<Item>)
			if (match == ItemFilterResult.Ok) {
				filteredItems.set(id, itemTemplate);
			}
		}
		return filteredItems;
	}

	static getSelectedItems(): Set<string> {
		if (this.#currentCharacter) {
			const selectedItems = new Set<string>();

			for (const [id] of this.#currentCharacter.items) {
				selectedItems.add(id);
			}

			return selectedItems;
		} else {
			return new Set<string>();
		}
	}

	static getSelectedEffects(): Set<Effect> {
		if (this.#currentCharacter) {
			const selectedEffects = new Set<Effect>();

			for (const effect of this.#currentCharacter.effects) {
				selectedEffects.add(effect);
			}

			return selectedEffects;
		} else {
			return new Set<Effect>();
		}
	}

	static getConflictingItems(): Set<string> {
		if (this.#currentCharacter) {
			const conflictingItems = new Set<string>();

			for (const [id1, item1] of this.#currentCharacter.items) {
				for (const [id2, item2] of this.#currentCharacter.items) {
					if (item1 != item2 && item1.isConflicting(item2)) {
						conflictingItems.add(id1);
						conflictingItems.add(id2);
					}
				}
			}

			return conflictingItems;
		} else {
			return new Set<string>();
		}
	}

	static #initItems(): Promise<void> {
		if (!this.#loadItemsPromise) {
			this.#loadItemsPromise = new Promise((resolve) => {
				const url = `${TF2_REPOSITORY}generated/items/items_${this.#lang}.json`;
				fetch(new Request(url)).then((response) => {
					response.json().then((json) => {
						if (json) {
							this.#initItems2(json.items);
							this.#initEffects(json.systems);
							Controller.dispatchEvent<void>(ControllerEvent.ItemsLoaded);
							Controller.dispatchEvent<void>(ControllerEvent.SystemsLoaded);
							resolve();
						}
					})
				});
			});
		}
		return this.#loadItemsPromise;
	}

	static #initItems2(itemList: JSONObject, tournamentMedals = false): void {
		//this.#systemList = itemList.systems as JSONObject;
		/*
				let keysSorted = Object.keys(itemList).sort(function (a, b) {
					let aa = a.split('~');
					let bb = b.split('~');
					let aaa = Number(aa[0]);
					let bbb = Number(bb[0]);
					if (aaa > bbb) {
						return 1;
					} else if (aaa < bbb) {
						return -1;
					} else {
						aaa = Number(aa[1]);
						bbb = Number(bb[1]);
						if (aaa > bbb) {
							return 1;
						} else if (aaa < bbb) {
							return -1;
						}
						return 0;
					}
				}
				)
				*/

		for (const itemIndex in itemList) {
			//let keywords = '';
			const itemDefinition = itemList[itemIndex] as JSONObject;
			itemDefinition.is_tournament_medal = tournamentMedals;
			const itemTemplate = new ItemTemplate(itemIndex, itemDefinition);
			//item.id = itemIndex;

			this.#itemTemplates.set(itemIndex, itemTemplate);

			const collection = itemTemplate.getCollection();
			if (collection) {
				if (!itemTemplate.getHide()) {
					this.#itemCollections.add(collection);
				}
				itemTemplate.addKeyword(collection);
			}


			const it: any/*TODO:better type*/ = {};
			//it.view = this.#createItemView(item, it);
			it.item = itemTemplate;
			/*
			if (item.hide) {
				it.hide = true;
			}
			*/
			//this.#itemTemplates.set(itemIndex, it);

			//if (item.player_bodygroups) {
			//keywords = item.player_bodygroups.join(' ');//TODO
			//}
			for (const equipRegion of itemTemplate.equipRegions) {
				//let region = (itemTemplate.equip_regions as JSONArray)[i];
				//keywords += equipRegion;
				itemTemplate.addKeyword(equipRegion);
				//this.addFilterOption(equipRegion as string);
				this.#equipRegions.add(equipRegion);
			}

			const itemSlot = itemTemplate.getItemSlot();
			if (itemSlot) {// TODO: slots per class
				itemTemplate.addKeyword(itemSlot);
				//this.addFilterOption(itemTemplate.item_slot as string);
			}

			const grade = itemTemplate.getGrade();
			if (grade) {
				itemTemplate.addKeyword(grade);
			}
			//itemTemplate.keywords = keywords;

			//characters[c.npc].modelName = c.model;
		}

		//this.dispatchEvent(new CustomEvent('itemsInitialized'));
		//this.#applyFilter();
		//this.#sortItems();
		//this.#updateFilters();
	}

	static #initEffects(systemList: JSONObject): void {
		for (const effectType in systemList) {
			const group = systemList[effectType] as JSONObject;
			for (const effectIndex in group) {
				const effectIndexN = Number(effectIndex);
				this.#effectTemplates.set(effectType as EffectType, effectIndexN, new EffectTemplate(effectType as EffectType, effectIndexN, group[effectIndex] as JSONObject));
			}
		}
	}

	static getEffects(type: EffectType): Map<number, EffectTemplate> {
		return new Map<number, EffectTemplate>(this.#effectTemplates.getSubMap(type));
	}

	static #pinItem(item: ItemTemplate, isPinned: boolean): void {
		const pinned: string[] = OptionsManager.getItem('app.items.pinned') ?? [];
		const index = pinned.indexOf(item.id);
		if (isPinned) {
			if (index == -1) {
				pinned.push(item.id);
			}
		} else {
			pinned.splice(index, 1);
		}

		OptionsManager.setItem('app.items.pinned', pinned);
	}

	/*
	static #handleItemClicked(template: ItemTemplate): void {
		const currentCharacter = CharacterManager.getCurrentCharacter();

		if (currentCharacter) {
			currentCharacter.toggleItem(template);
		} else {
			//const item = new Item(template);
			//item.loadModel();
			Loadout.addItem(template.id);
		}
	}
	*/

	static #setSortingType(type: string/*TODO: create enum*/): void {
		/*
		if (this.#htmlSortType) {
			this.#htmlSortType.value = type;
		}
		*/
		switch (type) {
			case 'name':
				this.#sortByName();
				break;
			case 'index':
				this.#sortByIndex();
				break;
			case 'slot':
				this.#sortBySlot();
				break;
		}
	}

	static #sortByName(): void {
		const self = this;
		this.#itemTemplates[Symbol.iterator] = function* (): MapIterator<[string, ItemTemplate]> {
			yield* [...this.entries()].sort(
				(a, b) => {
					const aname = a[1].name;
					const bname = b[1].name;
					return aname < bname ? -self.#sortingDirection : self.#sortingDirection;
				}
			);
		}
	}

	static #sortBySlot(): void {
		const self = this;
		this.#itemTemplates[Symbol.iterator] = function* (): MapIterator<[string, ItemTemplate]> {
			yield* [...this.entries()].sort(
				(a, b) => {
					const aSlot = a[1].getItemSlot() ?? '';
					const bSlot = b[1].getItemSlot() ?? '';

					if (aSlot < bSlot) {
						return -self.#sortingDirection;
					}
					if (aSlot > bSlot) {
						return self.#sortingDirection;
					}
					const aname = a[1].name;
					const bname = b[1].name;
					return aname < bname ? -self.#sortingDirection : self.#sortingDirection;
				}
			);
		}
	}

	static #sortByIndex(): void {
		const self = this;
		this.#itemTemplates[Symbol.iterator] = function* (): MapIterator<[string, ItemTemplate]> {
			yield* [...this.entries()].sort(
				(a, b) => {
					const aname = a[1].id;
					const bname = b[1].id;
					const aId = parseInt(aname, 10);
					const bId = parseInt(bname, 10);

					if (aId == bId) {
						return 0;
					}

					return aId < bId ? -self.#sortingDirection : self.#sortingDirection;
				}
			);
		}
	}

	static getCollections(): Set<string> {
		return new Set(this.#itemCollections);
	}

	static async #addWarpaint(itemId: string, paintkitId: string, weaponName: string, descToken: string): Promise<void> {
		let template = this.getItemTemplate(itemId);
		if (!template) {
			itemId += '~0';
			template = this.getItemTemplate(itemId);
		}
		if (template) {
			/*
			template.paintKits = template.paintKits || new Map();
			let paintKits = template.paintKits;

			if (!template.paintKitsInitialized) {
				let div2 = createElement('img', {
					src: paintkitBundle03PNG,
					class: 'item-manager-item-icon-warpaint',
					parent: template.view,
					events: {
						click: () => this.showPaintKitsPanel(template)
					}
				});
				template.paintKitsInitialized = true;
			}
			paintKits.set(paintkitId, { 'weaponName': weaponName, 'descToken': descToken });
			template.weaponName = weaponName;
			*/

			if ((Number(itemId) >= 15000) && (Number(itemId) <= 15158)) {//old paintkits ID
				const weaponId = await this.#getWeaponByModel(await template.getModel(''/*TODO: set this parameter optional*/) ?? '');
				if (weaponId !== null) {
					await this.#addWarpaint(weaponId, paintkitId, weaponName, descToken);
					setLegacyPaintKit(Number(itemId), weaponId);
				}
			} else {
				template.addWarpaint(paintkitId, weaponName, descToken);
			}
		} else {
			console.error('weapon not found %i', itemId);
		}
	}

	static async #getWeaponByModel(path: string): Promise<string | null> {
		for (const [i, template] of this.#itemTemplates) {
			if (template.isWarPaintable() && await template.getModel('') == path) {
				return i;
			}
		}
		return null;
	}

	static async initWorkshopItems(): Promise<void> {
		if (!this.#initWorkshopPromise) {
			this.#initWorkshopPromise = new Promise<void>((resolve): void => {
				(async (): Promise<void> => {
					const response = await fetch(WORKSHOP_URL);
					const json = await response.json();
					if (json) {
						this.#addWorkshopItems(json)
					}

					Controller.dispatchEvent<void>(ControllerEvent.ItemsLoaded);
					resolve();
				})()
			});
		}
		await this.#initWorkshopPromise;
	}

	static #addWorkshopItems(responseJson: JSONObject): void {
		if (!responseJson) {
			return;
		}

		if (!responseJson.result || responseJson.result != '1') {
			return;
		}

		const itemList = responseJson.items as JSONObject[];
		if (!itemList) {
			return;
		}

		for (const item of itemList) {
			item.id = String(item.id as number);
			item.image_inventory = item.previewurl;
			item.is_workshop = true;
			item.name = item.title;
			item.workshopMetadata = null;
			item.paintable = true;// We don't have any clue about this

			// Create used_by_classes list from tags
			if (item.tags) {
				item.used_by_classes = {};
				const tagList = (item.tags as string).split(';');
				for (const tag of tagList) {
					//const tag = tagList[tagIndex];
					switch (tag) {
						case 'Demoman':
						case 'Engineer':
						case 'Heavy':
						case 'Medic':
						case 'Pyro':
						case 'Scout':
						case 'Sniper':
						case 'Soldier':
						case 'Spy':
							item.used_by_classes[tag.toLowerCase()] = 1;
							break;
					}
				}
			}

			const itemTemplate = new ItemTemplate('w' + item.id, item);
			this.#itemTemplates.set(itemTemplate.id, itemTemplate);

			//const keywords = '';
			if (item.player_bodygroups) {
				//keywords = item.player_bodygroups.join(' ');//TODO
			}
		}
	}

	static async initTournamentMedals(): Promise<void> {
		if (!this.#initWorkshopPromise) {
			this.#initWorkshopPromise = new Promise<void>((resolve): void => {
				(async (): Promise<void> => {
					const response = await fetch(`${TF2_REPOSITORY}generated/items/medals_${this.#lang}.json`);
					const json = await response.json();
					if (json) {
						this.#initItems2(json.items, true);
					}
					Controller.dispatchEvent<void>(ControllerEvent.ItemsLoaded);
					resolve();
				})()
			});
		}
		await this.#initWorkshopPromise;
	}
}
