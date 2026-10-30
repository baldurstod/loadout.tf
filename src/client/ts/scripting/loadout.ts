import { CanvasAttributes, Graphics } from 'harmony-3d';
import { MAIN_CANVAS } from '../constants';
import { loadoutScene, orbitCamera } from '../loadout/scene';


export class Loadout {
	readonly scene = loadoutScene;
	readonly camera = orbitCamera;

	getCanvas(): CanvasAttributes {
		return Graphics.getCanvas(MAIN_CANVAS)!;
	}
}
