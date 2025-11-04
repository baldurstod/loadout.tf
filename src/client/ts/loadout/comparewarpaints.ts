import { BoundingBox, CanvasLayout, Scene, SceneNode, Source1ModelInstance } from 'harmony-3d';
import { COMPARE_WARPAINTS_LAYOUT, LOADOUT_LAYOUT } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { Character } from './characters/character';
import { Tf2Class } from './characters/characters';
import { Item } from './items/item';
import { customLightsContainer, lightsContainer, loadoutColorBackground, orbitCamera, orbitCameraControl } from './scene';
import { quat, vec3 } from 'gl-matrix';

export const weaponLayout: CanvasLayout = {
	name: COMPARE_WARPAINTS_LAYOUT,
	views: [],
}

Controller.addEventListener(ControllerEvent.CharacterChanged, (event: Event) => characterChanged((event as CustomEvent<Character>).detail));
Controller.addEventListener(ControllerEvent.ItemAdded, (event: Event) => loadoutChanged((event as CustomEvent<Item>).detail));
Controller.addEventListener(ControllerEvent.ItemRemoved, (event: Event) => loadoutChanged((event as CustomEvent<Item>).detail));

function characterChanged(character: Character): void {
	if (character.characterClass == Tf2Class.CompareWarpaints) {
		Controller.dispatchEvent<string>(ControllerEvent.UseLayout, { detail: COMPARE_WARPAINTS_LAYOUT });
		initWeaponLayout(character.items);
	} else {
		Controller.dispatchEvent<string>(ControllerEvent.UseLayout, { detail: LOADOUT_LAYOUT });
	}

}

function loadoutChanged(item: Item): void {
	const character = item.getCharacter();
	if (character.characterClass != Tf2Class.CompareWarpaints) {
		return;
	}

	initWeaponLayout(character.items);
}

async function initWeaponLayout(weapons: Map<string, Item>): Promise<void> {
	weaponLayout.views = [];

	const side = Math.max(Math.ceil(Math.sqrt(weapons.size)), 1);

	//const weaponScene = new Scene({ background: loadoutColorBackground });
	const viewSide = 1 / side;

	const entries = weapons.entries();

	for (let i = 0; i < side; i++) {
		for (let j = 0; j < side; j++) {

			const weaponScene = new Scene({
				background: loadoutColorBackground, childs: [
					new SceneNode({ entity: customLightsContainer }),
					new SceneNode({ entity: lightsContainer }),
				]
			});
			weaponScene.activeCamera = orbitCamera;
			orbitCameraControl.target.setPosition(vec3.create());

			const item = entries.next().value;

			if (item) {
				const weapon = item[1];
				const weaponModel = await weapon.getModel();
				if (weaponModel) {
					weaponScene.addChild(weaponModel);
					centerModel(weaponModel);
				}
			}

			weaponLayout.views.push({
				scene: weaponScene,
				viewport: {
					x: i * viewSide,
					y: j * viewSide,
					width: viewSide,
					height: viewSide,
				}
			});
		}
	}
}

function centerModel(model: Source1ModelInstance): void {
	let min = vec3.create();
	let max = vec3.create();
	let boundingBox = new BoundingBox();
	model.getBoundingBox(boundingBox);
	const pos = model.getWorldPosition();
	const rot = model.getWorldQuaternion();
	quat.invert(rot, rot);
	model.getBoundingBox(boundingBox);
	vec3.sub(pos, boundingBox.center, pos);
	vec3.transformQuat(pos, pos, rot);
	model.setPosition(vec3.negate(pos, pos));

}
