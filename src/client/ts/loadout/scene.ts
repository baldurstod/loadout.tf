import { Camera, ColorBackground, HALF_PI, OrbitControl, Scene, SceneExplorer, Source1ModelInstance, Source1ModelManager } from 'harmony-3d';

export const loadoutScene = new Scene();
export const loadoutColorBackground = new ColorBackground();
export const loadoutCamera = new Camera({ nearPlane: 10, farPlane: 5000, autoResize: true });
export const loadoutOrbitControl = new OrbitControl(loadoutCamera);

new SceneExplorer().setScene(loadoutScene);
loadoutScene.activeCamera = loadoutCamera;
loadoutScene.addChild(loadoutCamera);
loadoutScene.background = loadoutColorBackground;

export function setPolarRotation(polarRotation: boolean): void {
	if (polarRotation) {
		loadoutOrbitControl.minPolarAngle = -Infinity;
		loadoutOrbitControl.maxPolarAngle = Infinity;
	} else {
		loadoutOrbitControl.minPolarAngle = HALF_PI;
		loadoutOrbitControl.maxPolarAngle = HALF_PI;
	}
}

export async function addTF2Model(path: string, repository?: string, name?: string): Promise<Source1ModelInstance | null> {
	const model = await Source1ModelManager.createInstance(repository ?? 'tf2', path, true);
	if (!model) {
		return null;
	}
	if (name) {
		model.name = name;
	}
	model.setupPickingId();
	loadoutScene?.addChild(model);
	const itemStartSeq = model.sourceModel.mdl.getSequenceById(0);
	if (itemStartSeq) {
		model.playSequence(itemStartSeq.name);
		model.setAnimation(0, itemStartSeq.name, 1);
	}
	model.frame = 0.;
	return model;
}
