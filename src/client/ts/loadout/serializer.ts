import { quat, vec3 } from 'gl-matrix';
import { Controller, ControllerEvent } from '../controller';
import { getKillstreakColor, KillstreakColor } from '../paints/killstreaks';
import { Character } from './characters/character';
import { CharacterManager } from './characters/charactermanager';
import { npcToClass } from './characters/characters';
import { Effect } from './effects/effect';
import { EffectType } from './effects/effecttemplate';
import { Team } from './enums';
import { Item } from './items/item';
import { ItemManager } from './items/itemmanager';

export const DEFAULT_WARPAINT_WEAR = 0;
export const DEFAULT_WARPAINT_SEED = 0n;
export const DEFAULT_PAINT_ID = 0;
export const DEFAULT_SHEEN_ID = 0;

export const NULL_VECTOR = vec3.create();

export type itemJSON = {
	id: string,
	style?: string,
	is_workshop?: boolean,
	paint_id?: number,
	sheen_id?: number,
	kill_count?: number,
	weapon_effect_id?: number,
	warpaint_id?: number,
	warpaint_wear?: number,
	// bigint stored as a string
	warpaint_seed?: string,
	show_festivizer?: boolean,

	// For lagacy loadouts. This is only in use for importing loadouts
	paintId?: number,
	sheenId?: number,
	killCount?: number,
	weaponEffectId?: number,
	warpaintId?: number,
	warpaintWear?: number,
	// bigint stored as a string
	warpaintSeed?: string,

	paint_kit_id?: number,
	paint_kit_wear?: number,
	// bigint stored as a string
	paint_kit_seed?: string,
}

export type effectJSON = {
	id: number;
	offset?: vec3;
	color?: KillstreakColor;
}

export type legacyKillstreakEffectJSON = {
	effect: string;
	color: vec3;
}

export type characterJSON = {
	npc: string;
	team?: Team;
	items?: itemJSON[];
	effects?: effectJSON[];
	position?: vec3;
	orientation?: quat;
	decapitation_level?: number;

	// For legacy loadouts. This is only in use for importing loadouts
	quaternion?: quat;
	unusualEffects?: [];
	killstreak_effect?: legacyKillstreakEffectJSON;
	taunt_effect?: string;
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

	if (characterJSON.team !== undefined) {
		character.setTeam(characterJSON.team);

	}

	const jsonToItem = new Map<itemJSON, Item>();
	if (characterJSON.items) {
		// Phase 1: create the items
		for (const itemJSON of characterJSON.items) {
			const item = await importItem1(context, character, itemJSON);
			if (item) {
				jsonToItem.set(itemJSON, item);
			}
		}

		// Phase 2: set the items attributes
		for (const itemJSON of characterJSON.items) {
			const item = jsonToItem.get(itemJSON);
			if (item) {
				importItem2(context, item, itemJSON);
			}
		}
	}

	if (characterJSON.decapitation_level) {
		character.setDecapitationLevel(characterJSON.decapitation_level);
	}

	if (characterJSON.effects) {
		for (const effect of characterJSON.effects) {
			importEffect(context, character, effect);
		}
	}

	if (characterJSON.unusualEffects) {
		for (const effect of characterJSON.unusualEffects) {
			importEffect(context, character, effect);
		}
	}

	if (characterJSON.killstreak_effect) {
		const result = ItemManager.getEffectTemplateBySystem(characterJSON.killstreak_effect.effect);
		const killstreakColor = getKillstreakColor(characterJSON.killstreak_effect.color);

		if (result) {
			//console.info(template, killstreakColor);
			const [, , template] = result;
			if (template && killstreakColor) {
				character.setKillsteakEffect(template, killstreakColor);
			}
		}
	}

	if (characterJSON.taunt_effect) {
		const result = ItemManager.getEffectTemplateBySystem(characterJSON.taunt_effect);

		if (result) {
			const [, , template] = result;
			if (template) {
				character.setTauntEffect(template);
			}
		}
	}

	return true;
}

async function importItem1(context: ImportContext, character: Character, itemJSON: itemJSON): Promise<Item | null> {
	let itemId = itemJSON.id;
	if (itemJSON.style) {
		itemId += '~' + itemJSON.style;
	}
	let itemTemplate = ItemManager.getItemTemplate(itemId);
	if (!itemTemplate) {
		itemTemplate = ItemManager.getItemTemplate('w' + itemId);
	}

	if (!itemTemplate) {
		return null;
	}

	const item = await character.addItem(itemTemplate);
	return item;
}

async function importItem2(context: ImportContext, item: Item, itemJSON: itemJSON): Promise<void> {
	const paintId = itemJSON.paint_id ?? itemJSON.paintId;
	if (paintId !== undefined) {
		item.setPaint(paintId);
	}

	const sheenId = itemJSON.sheen_id ?? itemJSON.sheenId;
	if (sheenId !== undefined) {
		item.setSheen(sheenId);
	}

	item.setStatClock(itemJSON.kill_count ?? itemJSON.killCount ?? null);

	item.setWeaponEffectId(itemJSON.weapon_effect_id ?? itemJSON.weaponEffectId ?? null);
	const warpaint = itemJSON.warpaint_id ?? itemJSON.paint_kit_id ?? itemJSON.warpaintId;
	if (warpaint) {
		await initWarpaints();
		item.setWarpaint(warpaint, itemJSON.warpaint_wear ?? itemJSON.paint_kit_wear ?? itemJSON.warpaintWear ?? 0, BigInt(itemJSON.warpaint_seed ?? itemJSON.paint_kit_seed ?? itemJSON.warpaintSeed ?? 0));
	}
}

function importEffect(context: ImportContext, character: Character, effectJSON: effectJSON): Effect | null {
	const result = ItemManager.getEffectTemplateById(Number(effectJSON.id));

	if (!result) {
		return null;
	}

	const [type, template] = result;

	switch (type) {
		case EffectType.Cosmetic:
			character.addEffect(template);
			break;
		case EffectType.Killstreak:
			character.setKillsteakEffect(template, effectJSON.color);
			break;
		case EffectType.Taunt:
			character.setTauntEffect(template);
			break;
	}

	return null;
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
	const characterJSON: characterJSON = { npc: character.npc, items: [], effects: [] };

	for (const [, item] of character.items) {
		characterJSON.items!.push(exportItem(item));
	}
	for (const effect of character.effects) {
		characterJSON.effects!.push(exportEffect(effect));
	}

	const tauntEffect = character.getTauntEffect();
	if (tauntEffect) {
		characterJSON.effects!.push(exportEffect(tauntEffect));
	}

	const killstreakEffects = character.getKillstreakEffects();
	if (killstreakEffects) {
		for (const effect of killstreakEffects) {
			if (effect) {
				characterJSON.effects!.push(exportEffect(effect));
				break;
			}
		}
	}

	if (character.getDecapitationLevel() > 0) {
		characterJSON.decapitation_level = character.getDecapitationLevel();
	}

	if (!characterJSON.items!.length) {
		characterJSON.items = undefined;
	}
	if (!characterJSON.effects!.length) {
		characterJSON.effects = undefined;
	}

	return characterJSON;
}

function exportItem(item: Item): itemJSON {
	const idStyle = item.id.split('~');

	const paintId = item.getPaint()?.id;
	const sheenId = item.getSheen()?.id;
	const warpaintWear = item.getWarpaintWear();

	return {
		id: idStyle[0]!,
		style: idStyle[1],
		paint_id: paintId,
		sheen_id: sheenId != 0 ? sheenId : undefined,
		kill_count: item.getKillCount() ?? undefined,
		weapon_effect_id: item.getWeaponEffectId() ?? undefined,
		paint_kit_id: item.getWarpaintId() ?? undefined,
		paint_kit_wear: warpaintWear != DEFAULT_WARPAINT_WEAR ? warpaintWear : undefined,
		paint_kit_seed: item.getWarpaintSeed() != 0n ? String(item.getWarpaintSeed()) : undefined,
		show_festivizer: item.getShowFestivizer() ? item.getShowFestivizer() : undefined,
	};
}

function exportEffect(effect: Effect): effectJSON {
	return {
		id: effect.template.id,
		offset: vec3.exactEquals(NULL_VECTOR, effect.offset) ? undefined : effect.offset,
		color: effect.killstreakColor ? effect.killstreakColor : undefined,
	}
}

let initWarpaintsResolve: () => void;
const initWarpaintsPromise = new Promise<void>((resolve) => {
	initWarpaintsResolve = resolve;
});

let initialized = false;
async function initWarpaints(): Promise<void> {
	if (!initialized) {
		Controller.dispatchEvent<void>(ControllerEvent.InitWarpaints);
		initialized = true;
	}

	await initWarpaintsPromise;
}

function handleWarpaintsLoaded(): void {
	initWarpaintsResolve();
	Controller.removeEventListener(ControllerEvent.WarpaintsLoaded, handleWarpaintsLoaded);
}

Controller.addEventListener(ControllerEvent.WarpaintsLoaded, handleWarpaintsLoaded);
