import { CanvasAttributes, Graphics } from 'harmony-3d';
import { uint } from 'harmony-types';
import { MAIN_CANVAS } from '../constants';
import { Character } from '../loadout/characters/character';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { Tf2Class } from '../loadout/characters/characters';


export class Loadout {
	async addCharacter(tf2Class: Tf2Class, slotId?: uint): Promise<Character | null> {
		return CharacterManager.selectCharacter(tf2Class, slotId);
	}

	useDisposition(name: string): void {
		CharacterManager.useDisposition(name);
	}

	async setupMeetTheTeam(): Promise<void> {
		await CharacterManager.setupMeetTheTeam();
	}

	getCanvas(): CanvasAttributes {
		return Graphics.getCanvas(MAIN_CANVAS)!;
	}
}
