import { ItemFilterAttribute } from '../../controller';
import { CharactersList, Tf2Class } from '../characters/characters';
import { hasConflict } from './hasconflict';
import { Item } from './item';
import { ItemTemplate } from './itemtemplate';

export enum ItemFilterResult {
	Ok,
	ExcludedClass,
	ExcludedFilter,
	Conflicting,
}

export class ItemFilter {
	name?: string;
	selected = false;
	workshop = false;
	hideConflict?: boolean;
	tournamentMedals = false;
	showMultiClass = true;
	showOneClass = true;
	showAllClass = true;
	doNotFilterPerClass = false;
	pinned: string[] = [];
	paintable?: boolean;
	warpaintable?: boolean;
	halloween?: boolean;
	displayMedals = true;
	displayWeapons = true;
	displayCosmetics = true;
	displayTaunts = true;
	collection?: string;

	matchFilter(item: ItemTemplate, excludedItems: { e: number }, characterClass: Tf2Class | null, activeItems: Set<Item>): ItemFilterResult {
		let ret = false;
		let highlightConflict = false;
		let isWeapon = false;
		let isTaunt = false;
		let name: string | undefined;
		if (characterClass !== null) {
			name = CharactersList.get(characterClass)?.name;
		}

		if (item.getHide()) {
			return ItemFilterResult.ExcludedFilter;
		}

		switch (item.getItemSlot(name ?? 'scout'/*TODO: fix that*/)) {
			case 'primary':
			case 'secondary':
			case 'melee':
			case 'pda':
			case 'pda2':
			case 'building':
			case 'force_building':
				isWeapon = true;
				break;
			case 'taunt':
				isTaunt = true;
				break;
		}

		if (!this.doNotFilterPerClass && characterClass !== null && characterClass !== Tf2Class.None && !item.isUsedByClass(characterClass)) {
			return ItemFilterResult.ExcludedClass;
		}

		const f = this.name;
		let positive = false;
		if (f && f != '') {
			const filterArray = f.split(';');
			for (let f of filterArray) {
				f = f.trim();
				if (f == '' || f == '-') {
					continue;
				}
				let exclude = false;
				if (f.startsWith('-')) {
					exclude = true;
					f = f.slice(1);
				}
				//const keywords: string = item.keywords;
				const itemName = item.name;
				if (item.hasKeyword(f)) {
					if (exclude) {
						return ItemFilterResult.ExcludedClass;
					}
					ret = true;
				} else {
					if (exclude) {
						ret = true;
					}
				}
				if (itemName.toLowerCase().includes(f)) {
					if (exclude) {
						return ItemFilterResult.ExcludedClass;
					}
					ret = true;
				} else {
					if (exclude) {
						ret = true;
					}
				}

				if (!exclude && ret) {
					positive = true;
				}
			}
		} else {
			ret = true;
			positive = true;
		}

		if (!ret || !positive) {
			return ItemFilterResult.ExcludedClass;
		}

		if (!isWeapon && this.paintable !== undefined && this.paintable != item.isPaintable()) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}

		if (isWeapon && this.warpaintable !== undefined && this.warpaintable != item.isWarPaintable()) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}

		//if (this.halloween !== undefined && (this.halloween && item.holiday_restriction == 'halloween_or_fullmoon')) {
		if (this.halloween !== undefined && this.halloween != item.isHalloweenRestricted()) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}

		let filterWeapon = true;
		let filterMedal = true;
		let filterCosmetic = true;
		let filterTaunt = true;
		let isMedal = false;

		const itemTypeName = item.getItemTypeName();
		if (itemTypeName == 'Community Medal' || itemTypeName == 'Tournament Medal' || itemTypeName == 'Badge' || itemTypeName == 'Medallion' || itemTypeName == 'Func_Medal') {
			isMedal = true;
		}

		if (this.displayMedals) {
			//console.log(item);
			if (isMedal) {
				filterMedal = false;
			}
		}

		if (this.displayWeapons || this.displayCosmetics || this.displayTaunts) {
			if (isWeapon) {
				if (this.displayWeapons) {
					filterWeapon = false;
				}
			} else if (isTaunt) {
				if (this.displayTaunts) {
					filterTaunt = false;
				}
			} else {
				if (this.displayCosmetics) {
					if (!isMedal) {
						filterCosmetic = false;
					}
				}
			}
		}

		if (filterWeapon && filterMedal && filterCosmetic && filterTaunt) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}

		const useByClasses = item.classCount();
		if (!this.showOneClass && useByClasses == 1) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}
		if (!this.showMultiClass && useByClasses > 1 && useByClasses < 9) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}
		if (!this.showAllClass && useByClasses == 9) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}

		if (this.selected) {
			const itemId = item.id;
			if (this.pinned.indexOf(itemId) > -1) {
				return ItemFilterResult.Ok;
			}
		}

		if (this.selected) {
			for (const itemId of activeItems) {
				if (itemId.id == item.id) {
					return ItemFilterResult.Ok;
				}
			}
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}

		if (this.collection) {
			if (this.collection != item.getCollection()) {
				++excludedItems.e;
				return ItemFilterResult.ExcludedFilter;
			}
		}

		if (this.tournamentMedals != (item.isTournamentMedal() == true)) {
			++excludedItems.e;
			return ItemFilterResult.ExcludedFilter;
		}

		if (this.hideConflict != undefined) {
			for (const characterItem of activeItems) {
				if (characterItem.id != item.id) {
					const equipRegions = item.equipRegions;
					//console.log(equipRegions);
					if (hasConflict(characterItem.getEquipRegions(), equipRegions)) {
						if (this.hideConflict) {
							++excludedItems.e;
							return ItemFilterResult.ExcludedFilter;
						} else {
							highlightConflict = true;
						}
					}
				}
				/*if (itemId == item.id) {
					return true;
				}*/
			}

			const arr = [];
			for (const activeItem of activeItems) {
				arr.push(activeItem);
			}

			let equip1: string[];
			let equip2: string[];

			for (const it of arr) {
				equip1 = it.getEquipRegions();
				if (it.id != item.id) {
					if (equip1) {
						equip2 = item.equipRegions;
						if (equip2) {
							//for (const k of equip1) {
							//for (const l of equip2) {
							if (hasConflict(equip1, equip2)) {
								++excludedItems.e;
								return ItemFilterResult.ExcludedFilter;
							}
							//}
							//}
						}
					}
				}
			}
		}

		if (this.workshop != item.isWorkshop()) {
			return ItemFilterResult.ExcludedClass;
		}

		if (highlightConflict) {
			return ItemFilterResult.Conflicting;
		}

		return ItemFilterResult.Ok;
	}

	setAttribute(attribute: ItemFilterAttribute, value: boolean | string | undefined): void {
		switch (attribute) {
			case ItemFilterAttribute.Name:
				this.name = value as string;
				break;
			case ItemFilterAttribute.Selected:
				this.selected = value as boolean;
				break;
			case ItemFilterAttribute.Workshop:
				this.workshop = value as boolean;
				break;
			case ItemFilterAttribute.HideConflict:
				this.hideConflict = value as boolean;
				break;
			case ItemFilterAttribute.TournamentMedals:
				this.tournamentMedals = value as boolean;
				break;
			case ItemFilterAttribute.ShowMultiClass:
				this.showMultiClass = value as boolean;
				break;
			case ItemFilterAttribute.ShowOneClass:
				this.showOneClass = value as boolean;
				break;
			case ItemFilterAttribute.ShowAllClass:
				this.showAllClass = value as boolean;
				break;
			case ItemFilterAttribute.DoNotFilterPerClass:
				this.doNotFilterPerClass = value as boolean;
				break;
			case ItemFilterAttribute.Paintable:
				this.paintable = value as boolean;
				break;
			case ItemFilterAttribute.Warpaintable:
				this.warpaintable = value as boolean;
				break;
			case ItemFilterAttribute.Halloween:
				this.halloween = value as boolean;
				break;
			case ItemFilterAttribute.DisplayMedals:
				this.displayMedals = value as boolean;
				break;
			case ItemFilterAttribute.DisplayWeapons:
				this.displayWeapons = value as boolean;
				break;
			case ItemFilterAttribute.DisplayCosmetics:
				this.displayCosmetics = value as boolean;
				break;
			case ItemFilterAttribute.DisplayTaunts:
				this.displayTaunts = value as boolean;
				break;
			case ItemFilterAttribute.Collection:
				this.collection = value as string;
				break;
			default:
				throw attribute;
				break;
		}

	}
}
