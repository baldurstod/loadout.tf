import { quat, vec3 } from 'gl-matrix';
import { BoundingBox, CanvasLayout, CanvasView, Entity, GraphicMouseEventData, GraphicsEvent, GraphicsEvents, Group, Scene, SceneNode, Source1ModelInstance, Viewport } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { COMPARE_WARPAINTS_LAYOUT, LOADOUT_LAYOUT, LOW_QUALITY_TEXTURE_SIZE, MID_QUALITY_TEXTURE_SIZE } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { Character } from './characters/character';
import { Tf2Class } from './characters/characters';
import { Item } from './items/item';
import { customLightsContainer, lightsContainer, loadoutColorBackground, loadoutScene, orbitCamera, orbitCameraControl } from './scene';

export const weaponLayout: CanvasLayout = {
	name: COMPARE_WARPAINTS_LAYOUT,
	views: [],
}

let compareWarpaints = false;
const warpaintsGroup = new Group({ parent: loadoutScene, name: 'warpaints' });

const weaponsToView = new Map<Source1ModelInstance, CanvasView>();
const modelToItem = new Map<Source1ModelInstance, Item>();
let highlitView: CanvasView | null = null;
let highlitViewport: Viewport | null = null;
let highlitModel: Entity | null = null;

Controller.addEventListener(ControllerEvent.CharacterChanged, (event: Event) => characterChanged((event as CustomEvent<Character>).detail));
Controller.addEventListener(ControllerEvent.ItemAdded, (event: Event) => loadoutChanged((event as CustomEvent<Item>).detail));
Controller.addEventListener(ControllerEvent.ItemRemoved, (event: Event) => loadoutChanged((event as CustomEvent<Item>).detail));
GraphicsEvents.addEventListener(GraphicsEvent.MouseClick, (event: Event) => handleClick(event as CustomEvent<GraphicMouseEventData>));
GraphicsEvents.addEventListener(GraphicsEvent.Tick, animate);

function characterChanged(character: Character): void {
	if (character.characterClass == Tf2Class.CompareWarpaints) {
		Controller.dispatchEvent<string>(ControllerEvent.UseLayout, { detail: COMPARE_WARPAINTS_LAYOUT });
		initWeaponLayout(character.items);
		compareWarpaints = true;
	} else {
		Controller.dispatchEvent<string>(ControllerEvent.UseLayout, { detail: LOADOUT_LAYOUT });
		compareWarpaints = true;
	}
}

function loadoutChanged(item: Item): void {
	const character = item.getCharacter();
	if (character.characterClass != Tf2Class.CompareWarpaints) {
		return;
	}

	initWeaponLayout(character.items);
}

let backgroundTextureSize = LOW_QUALITY_TEXTURE_SIZE;

async function initWeaponLayout(weapons: Map<string, Item>): Promise<void> {
	weaponsToView.clear();
	modelToItem.clear();
	weaponLayout.views = [];
	warpaintsGroup.removeChildren();
	weaponLayout.views.push({
		scene: new Scene({ background: loadoutColorBackground, camera: orbitCamera, }),
		layer: -1,
	});

	const side = Math.max(Math.ceil(Math.sqrt(weapons.size)), 1);

	//const weaponScene = new Scene({ background: loadoutColorBackground });
	const viewSide = 1 / side;

	const entries = weapons.entries();

	const forceLowQuality = weapons.size > OptionsManager.getItem('app.warpaints.compare.lowqualitythreshold');
	const forceMidQuality = !forceLowQuality && (weapons.size > OptionsManager.getItem('app.warpaints.compare.midqualitythreshold'));

	switch (true) {
		case forceLowQuality:
			backgroundTextureSize = LOW_QUALITY_TEXTURE_SIZE;
			break;
		case forceMidQuality:
			backgroundTextureSize = MID_QUALITY_TEXTURE_SIZE;
			break;
		default:
			backgroundTextureSize = OptionsManager.getItem('warpaints.texture.size');
	}

	for (let i = 0; i < side; i++) {
		for (let j = 0; j < side; j++) {

			const weaponScene = new Scene({
				//parent: warpaintsGroup,
				//background: loadoutColorBackground,
				childs: [
					new SceneNode({ entity: customLightsContainer }),
					new SceneNode({ entity: lightsContainer }),
				],
				camera: orbitCamera,
			});
			orbitCameraControl.target.setPosition(vec3.create());

			const item = entries.next().value;


			const view = {
				scene: weaponScene,
				viewport: {
					x: i * viewSide,
					y: j * viewSide,
					width: viewSide,
					height: viewSide,
				}
			};

			if (item) {
				const weapon = item[1];
				const weaponModel = await weapon.getModel();
				if (weaponModel) {
					modelToItem.set(weaponModel, weapon);
					weaponScene.addChild(weaponModel);
					weapon.changeTextureSize = backgroundTextureSize;
					weapon.setTextureSize(backgroundTextureSize);
					// Compute bones for correct bounding box
					await weaponModel.updateAsync(weaponScene, orbitCamera, 0);
					centerModel(weaponModel);
					// Not sure wgy I have to do this, but this is needed for the degreaser
					setTimeout(() => centerModel(weaponModel), 100);
					weaponsToView.set(weaponModel, view);
				}
			}
			weaponLayout.views.push(view);
		}
	}
}

function centerModel(model: Source1ModelInstance): void {
	const boundingBox = new BoundingBox();
	const pos = model.getWorldPosition();
	const rot = model.getWorldQuaternion();
	quat.invert(rot, rot);
	model.getBoundingBox(boundingBox);
	vec3.sub(pos, boundingBox.center, pos);
	vec3.transformQuat(pos, pos, rot);
	model.setPosition(vec3.negate(pos, pos));
}

function handleClick(pickEvent: CustomEvent<GraphicMouseEventData>): void {
	if (!compareWarpaints) {
		return;
	}

	const model = pickEvent.detail.entity;
	if (!model) {
		return;
	}

	if (highlitView) {
		highlitView.layer = undefined;
		highlitView.clearDepth = undefined;
		highlitView.viewport = highlitViewport ?? undefined;
		highlitView = null;
		highlitViewport = null;
		for (const v of weaponLayout.views) {
			v.enabled = undefined;
		}

		const highlitItem = modelToItem.get(highlitModel as Source1ModelInstance);
		if (highlitItem) {
			// Set the texture size to low quality
			highlitItem.changeTextureSize = backgroundTextureSize;
		}

		if (highlitModel == model) {
			// The highlit model was clicked, close it
			highlitModel = null;
			return;
		}
	}

	//this.#selectCharacterPerDynamicProp(model);
	//console.info(model);
	const view = weaponsToView.get(model as Source1ModelInstance);
	if (!view) {
		return;
	}

	if (view == highlitView) {
		return;
	}

	for (const v of weaponLayout.views) {
		if (v != view) {
			//v.enabled = false;
		}
	}

	highlitViewport = view.viewport ?? null;

	view.viewport = undefined;
	view.clearDepth = true;

	highlitView = view;
	highlitView.layer = 10;
	highlitModel = model;

	const item = modelToItem.get(model as Source1ModelInstance);
	if (item) {
		const textureSize = OptionsManager.getItem('warpaints.texture.size');
		item.changeTextureSize = textureSize;
		item.setTextureSize(textureSize);
	}
}

const tempQuat = quat.create();
function animate(): void {
	if (!compareWarpaints) {
		return;
	}

	orbitCamera.getQuaternion(tempQuat)
	customLightsContainer?.setQuaternion(tempQuat);
	lightsContainer.setQuaternion(tempQuat);

}
