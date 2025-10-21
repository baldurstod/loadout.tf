import { Camera, ColorBackground, HALF_PI, OrbitControl, Scene, SceneExplorer, Source1ModelInstance, Source1ModelManager } from 'harmony-3d';
import { CameraType } from '../enums';

export const loadoutScene = new Scene();
export const loadoutColorBackground = new ColorBackground();
export const orbitCamera = new Camera({ name: 'Orbit camera', nearPlane: 10, farPlane: 5000, autoResize: true });
export const firstPersonCamera = new Camera({ nearPlane: 5, farPlane: 1000, verticalFov: 90, name: 'First person camera', autoResize: true });
export const orbitCameraControl = new OrbitControl(orbitCamera);
export let activeCamera = orbitCamera;
new SceneExplorer().setScene(loadoutScene);
loadoutScene.activeCamera = orbitCamera;
loadoutScene.addChild(orbitCamera);
loadoutScene.background = loadoutColorBackground;

export function setPolarRotation(polarRotation: boolean): void {
	if (polarRotation) {
		orbitCameraControl.minPolarAngle = -Infinity;
		orbitCameraControl.maxPolarAngle = Infinity;
	} else {
		orbitCameraControl.minPolarAngle = HALF_PI;
		orbitCameraControl.maxPolarAngle = HALF_PI;
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

export function setActiveCamera(cameraType: CameraType): void {
	let camera: Camera;
	switch (cameraType) {
		case CameraType.Orbit:
			camera = orbitCamera;
			break;
		case CameraType.FreeFly:
			camera = orbitCamera;
			//this.#setActiveCameraControl(this.#orbitCameraControl);
			break;
			/*
		case 'freefly':
			this.camera = this.#orbitCamera;
			this.#setActiveCameraControl(this.#firstPersonCameraControl)
			break;
			*/
		case CameraType.FirstPerson:
			camera = firstPersonCamera;
//			this.#setActiveCameraControl()
			break;
	}


	activeCamera = camera;
	camera.setActiveCamera();
}
