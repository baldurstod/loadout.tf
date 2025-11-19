import { CanvasAttributes, Graphics } from 'harmony-3d';
import { MAIN_CANVAS } from '../constants';
import { loadoutScene, orbitCamera } from '../loadout/scene';


export class Loadout {
	readonly scene = loadoutScene;
	readonly camera = orbitCamera;

	/*
	async addCharacter(tf2Class: Tf2Class, slotId?: uint): Promise<Character | null> {
		return CharacterManager.selectCharacter(tf2Class, slotId);
	}

	useDisposition(name: string): void {
		CharacterManager.useDisposition(name);
	}

	async setupMeetTheTeam(): Promise<void> {
		await CharacterManager.setupMeetTheTeam();
	}
	*/

	getCanvas(): CanvasAttributes {
		return Graphics.getCanvas(MAIN_CANVAS)!;
	}
}
