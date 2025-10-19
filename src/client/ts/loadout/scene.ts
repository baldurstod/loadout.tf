import { Camera, ColorBackground, HALF_PI, OrbitControl, Scene, SceneExplorer } from 'harmony-3d';

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
