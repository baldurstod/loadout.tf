import { Characters } from './loadout/characters/characters';

export const EVENT_ADD_ITEM = 'add-item';
export const EVENT_REFRESH_WEAPON_UNUSUAL = 'refresh-weapon-unusual';
export const EVENT_SETUP_MEET_THE_TEAM = 'setup-meet-the-team';

export enum LoadoutEvents {
	CharacterSelected = 'characterselected',
}


export type CharacterSelected = {
	character: Characters,
};
