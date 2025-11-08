import { quat, vec3 } from 'gl-matrix';
import { getKillstreak } from '../paints/killstreaks';
import { getPaint } from '../paints/paints';
import { Character } from './characters/character';
import { CharacterManager } from './characters/charactermanager';
import { npcToClass } from './characters/characters';
import { Team } from './enums';
import { Item } from './items/item';
import { ItemManager } from './items/itemmanager';

export const DEFAULT_PAINTKIT_WEAR = 0;
export const DEFAULT_PAINTKIT_SEED = 0n;
export const DEFAULT_PAINT_ID = 0;
export const DEFAULT_SHEEN_ID = 0;

export type itemJSON = {
	id: string,
	style?: string,
	is_workshop?: boolean,
	paint_id?: number,
	sheen_id?: number,
	kill_count?: number,
	weapon_effect_id?: number,
	paint_kit_id?: number,
	paint_kit_wear?: number,
	// bigint stored as a string
	paint_kit_seed?: string,
	show_festivizer?: boolean,

	// For lagacy loadouts. This is only in use for importing loadouts
	paintId?: number,
	sheenId?: number,
	killCount?: number,
	weaponEffectId?: number,
	paintKitId?: number,
	paintKitWear?: number,
	// bigint stored as a string
	paintKitSeed?: string,
	showFestivizer?: boolean,
}

export type characterJSON = {
	npc: string;
	team?: Team;
	items?: itemJSON[];
	effects?: never[];
	position?: vec3;
	orientation?: quat;

	// For lagacy loadouts. This is only in use for importing loadouts
	quaternion?: quat;
}

export type loadoutJSON = {
	characters: characterJSON[],
}

type ImportContext = {
	slot: number;
	errors: string[];
}

export async function importLoadout(json: loadoutJSON): Promise<boolean> {
	let result = true;
	const context: ImportContext = { slot: 0, errors: [] };

	CharacterManager.setSlotsSize(json.characters.length, true);
	for (const characterJSON of json.characters) {
		if (await importCharacterLoadout(context, characterJSON)) {
			++context.slot;
		} else {
			result = false;
		}
	}
	return result;
}

async function importCharacterLoadout(context: ImportContext, characterJSON: characterJSON): Promise<boolean> {
	const tf2Class = npcToClass(characterJSON.npc);
	if (!tf2Class) {
		return false;
	}

	const slot = CharacterManager.getSlot(context.slot);
	if (slot) {
		if (characterJSON.position) {
			vec3.copy(slot.position, characterJSON.position);
		}

		const orientation = characterJSON.orientation ?? characterJSON.quaternion;
		if (orientation) {
			quat.copy(slot.orientation, orientation);
		}
	}

	const character = await CharacterManager.selectCharacter(tf2Class, context.slot);

	if (characterJSON.items) {
		for (const itemJSON of characterJSON.items) {
			await importItem(context, character, itemJSON)
		}
	}
	return true;
}

async function importItem(context: ImportContext, character: Character, itemJSON: itemJSON): Promise<boolean> {
	const result = true;

	let itemId = itemJSON.id;
	if (itemJSON.style) {
		itemId += '~' + itemJSON.style;
	}
	let itemTemplate = ItemManager.getItemTemplate(itemId);
	if (!itemTemplate) {
		itemTemplate = ItemManager.getItemTemplate('w' + itemId);
	}

	if (!itemTemplate) {
		return false;
	}

	const [item] = await character.addItem(itemTemplate);

	const paintId = itemJSON.paint_id ?? itemJSON.paintId;
	if (paintId !== undefined) {
		item.setPaint(getPaint(paintId));
	}

	const sheenId = itemJSON.sheen_id ?? itemJSON.sheenId;
	if (sheenId !== undefined) {
		item.setSheen(getKillstreak(sheenId));
	}

	item.toggleStattrak(itemJSON.kill_count ?? itemJSON.killCount ?? null);

	item.setWeaponEffectId(itemJSON.weapon_effect_id ?? itemJSON.weaponEffectId ?? null);
	item.setPaintKitId(itemJSON.paint_kit_id ?? itemJSON.paintKitId ?? null);
	item.setPaintKitWear(itemJSON.paint_kit_wear ?? itemJSON.paintKitWear ?? 0);
	item.setPaintKitSeed(BigInt(itemJSON.paint_kit_seed ?? itemJSON.paintKitSeed ?? 0));


	/*
	paint_kit_id: this.#paintKitId,
	paint_kit_wear: this.#paintKitWear != DEFAULT_PAINTKIT_WEAR ? this.#paintKitWear : undefined,
	paint_kit_seed: this.#paintKitSeed != DEFAULT_PAINTKIT_SEED ? String(this.#paintKitSeed) : undefined,
	show_festivizer: this.#showFestivizer || undefined,
	*/


	//let item = await this.addItem(itemTemplate);


	return result;
}

export function exportLoadout(): loadoutJSON {
	const charactersJSON: characterJSON[] = [];

	const characters = CharacterManager.getCharacters();
	for (const character of characters) {
		charactersJSON.push(exportCharacterLoadout(character));
	}

	return { characters: charactersJSON };
}


function exportCharacterLoadout(character: Character): characterJSON {
	const characterJSON: characterJSON = { npc: character.npc };

	if (character.items.size) {
		characterJSON.items = [];
		for (const [, item] of character.items) {
			characterJSON.items.push(exportItem(item));
		}
	}
	return characterJSON;
}

function exportItem(item: Item): itemJSON {
	let idStyle = item.id.split('~');

	const paintId = item.getPaint()?.id;
	const sheenId = item.getSheen()?.id;
	const paintKitWear = item.getPaintKitWear();

	return {
		id: idStyle[0]!,
		style: idStyle[1],
		paint_id: paintId,
		sheen_id: sheenId != 0 ? sheenId : undefined,
		kill_count: item.getKillCount() ?? undefined,
		weapon_effect_id: item.getWeaponEffectId() ?? undefined,
		paint_kit_id: item.getPaintKitId() ?? undefined,
		paint_kit_wear: paintKitWear != DEFAULT_PAINTKIT_WEAR ? paintKitWear : undefined,
		paint_kit_seed: item.getPaintKitSeed() != 0n ? String(item.getPaintKitSeed()) : undefined,
		show_festivizer: item.getShowFestivizer() ? item.getShowFestivizer() : undefined,
	};
}
