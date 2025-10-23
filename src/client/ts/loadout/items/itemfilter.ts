import { Character } from '../characters/character';
import { hasConflict } from './hasconflict';

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

	matchFilter(item: any/*TODO: improve type*/, excludedItems: { e: number }, currentCharacter: Character | undefined, activeItems2: Record<string, any>): boolean[] {
		let ret = false;
		let highlightConflict = false;
		let isWeapon = false;
		let isTaunt = false;
		switch (item.item_slot) {
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

		if (!this.doNotFilterPerClass && currentCharacter && item.used_by_classes) {
			let match = false;
			for (const c in item.used_by_classes) {
				if (c == currentCharacter.name.toLowerCase()) {
					match = true;
					break;
				}
			}
			/*if (item.usedby.indexOf(filter.className.toLowerCase()) == -1) {
				return false;
			}*/
			if (!match) {
				return [false];
			}
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
				const keywords = item.keywords;
				const itemName = item.name;
				if (keywords && (keywords.toLowerCase().includes(f))) {
					if (exclude) {
						return [false];
					}
					ret = true;
				} else {
					if (exclude) {
						ret = true;
					}
				}
				if (itemName.toLowerCase().includes(f)) {
					if (exclude) {
						return [false];
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
			return [false];
		}

		if (!isWeapon && this.paintable !== undefined && ((this.paintable && item.paintable == undefined) || (!this.paintable && item.paintable == '1'))) {
			++excludedItems.e;
			return [false];
		}

		if (isWeapon && this.warpaintable !== undefined && ((this.warpaintable && item.paintkit_base == undefined) || (!this.warpaintable && item.paintkit_base == '1'))) {
			++excludedItems.e;
			return [false];
		}

		//if (this.halloween !== undefined && (this.halloween && item.holiday_restriction == 'halloween_or_fullmoon')) {
		if (!isWeapon && this.halloween !== undefined && ((this.halloween && item.holiday_restriction == undefined) || (!this.halloween && item.holiday_restriction == 'halloween_or_fullmoon'))) {
			++excludedItems.e;
			return [false];
		}

		let filterWeapon = true;
		let filterMedal = true;
		let filterCosmetic = true;
		let filterTaunt = true;
		let isMedal = false;

		const itemTypeName = item.item_type_name;
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
			return [false];
		}

		const useByClasses = Object.keys(item.used_by_classes).length;
		if (!this.showOneClass && useByClasses == 1) {
			++excludedItems.e;
			return [false];
		}
		if (!this.showMultiClass && useByClasses > 1 && useByClasses < 9) {
			++excludedItems.e;
			return [false];
		}
		if (!this.showAllClass && useByClasses == 9) {
			++excludedItems.e;
			return [false];
		}

		if (this.selected) {
			const itemId = item.id;
			if (this.pinned.indexOf(itemId) > -1) {
				return [true];
			}
		}

		if (this.selected && currentCharacter) {
			for (const itemId of currentCharacter.items.keys()) {
				if (itemId == item.id) {
					return [true];
				}
			}
			++excludedItems.e;
			return [false];
		}

		if (this.collection) {
			if (this.collection != item.collection) {
				++excludedItems.e;
				return [false];
			}
		}

		if (this.tournamentMedals != (item.isTournamentMedal == true)) {
			++excludedItems.e;
			return [false];
		}

		if ((this.hideConflict != undefined) && currentCharacter) {
			for (const characterItem of currentCharacter.items.values()) {
				if (characterItem.id != item.id) {
					const equipRegions = item.equip_regions;
					//console.log(equipRegions);
					if (hasConflict(characterItem.getEquipRegions(), equipRegions)) {
						if (this.hideConflict) {
							++excludedItems.e;
							return [false];
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
			const list2 = activeItems2;
			for (const i in list2) {
				arr.push(list2[i]);
			}

			let equip1;
			let equip2;

			for (const it of arr) {
				equip1 = it.equip_regions;
				if (it.id != item.id) {
					if (equip1) {
						equip2 = item.equip_regions;
						if (equip2) {
							for (const k of equip1) {
								for (const l of equip2) {
									if (hasConflict(k, l)) {
										++excludedItems.e;
										return [false];
									}
								}
							}
						}
					}
				}
			}
		}

		return [this.workshop == (item.isWorkshop ? true : false), highlightConflict];
	}

	setAttribute(name: string, value: boolean | string | undefined): void {

	}
}
