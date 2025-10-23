import { JSONObject } from 'harmony-types';
import { TF2_REPOSITORY } from '../../constants';
import { Controller, ControllerEvent, SetItemFilter } from '../../controller';
import { Character } from '../characters/character';
import { ItemFilter } from './itemfilter';
import { ItemTemplate } from './itemtemplate';
import { EffectTemplate } from './effecttemplate';
import { Panel } from '../../enums';

export class ItemManager {
	static #filters = new ItemFilter();
	static #currentCharacter: Character | null = null;
	static #lang = 'english';
	static #itemTemplates = new Set<ItemTemplate>();
	static #loadItemsPromise?: Promise<void>;
	static #loadMedalsPromise?: Promise<void>;
	static #systemList = new Map<string, EffectTemplate>();
	static #itemCollections = new Set<string>();
	static #equipRegions = new Set<string>();

	static {
		this.#initListeners();

	}

	static setCurrentCharacter(character: Character): void {
		this.#currentCharacter = character;
	}

	static setLang(lang: string): void {
		this.#lang = lang;
	}

	static #initListeners(): void {
		Controller.addEventListener(ControllerEvent.SetItemFilter, (event: Event) => this.setItemFilter((event as CustomEvent<SetItemFilter>).detail));

		Controller.addEventListener(ControllerEvent.ShowPanel, (event: Event) => {
			if ((event as CustomEvent<Panel>).detail == Panel.Items) {
				this.#initItems();
			}
		});
	}

	static setItemFilter(filter: SetItemFilter): void {
		this.#filters.setAttribute(filter.name, filter.value);
	}


	static getItems(): Set<ItemTemplate> {
		return new Set<ItemTemplate>(this.#itemTemplates);
	}

	static getFilteredItems(): Set<ItemTemplate> {
		return new Set<ItemTemplate>(this.#itemTemplates);
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
							console.info(this.#itemTemplates);
							Controller.dispatchEvent<void>(ControllerEvent.ItemsLoaded);
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

			this.#itemTemplates.add(itemTemplate);

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

			const itemSlot = itemTemplate.getItemSlot('scout');
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
	}
}
