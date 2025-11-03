import { AmbientLight, CanvasLayout, Scene } from 'harmony-3d';
import { COMPARE_WARPAINTS_LAYOUT, LOADOUT_LAYOUT } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { Character } from './characters/character';
import { Tf2Class } from './characters/characters';
import { Item } from './items/item';
import { loadoutColorBackground, orbitCamera } from './scene';

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

	const side = Math.ceil(Math.sqrt(weapons.size));

	//const weaponScene = new Scene({ background: loadoutColorBackground });
	let weaponId = 0;
	const viewSide = 1 / side;

	const entries = weapons.entries();

	for (let i = 0; i < side; i++) {
		for (let j = 0; j < side; j++) {

			const weaponScene = new Scene({ background: loadoutColorBackground, childs: [new AmbientLight()] });
			weaponScene.activeCamera = orbitCamera;

			const item = entries.next().value;

			if (item) {
				const weapon = item[1];
				weaponScene.addChild(await weapon.getModel());
				weapon.setPaintKit(303, 0, 0n);
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
