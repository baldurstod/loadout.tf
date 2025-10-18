import { vec3 } from 'gl-matrix';
import { Composer, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, HALF_PI, OrbitControl, WebGLStats } from 'harmony-3d';
import { createElement } from 'harmony-ui';
import { loadoutCamera, loadoutScene } from '../loadout/scene';

export class Viewer {
	#htmlElement!: HTMLElement;
	#htmlCanvas!: HTMLCanvasElement;
	#orbitControl;
	#composer?: Composer;

	constructor() {
		this.#initHTML();
		this.#orbitControl = new OrbitControl(loadoutCamera);
		loadoutCamera.setPosition([100, 0, 40]);
		this.#orbitControl.setTargetPosition([0, 0, 40]);
		this.#initRenderer();
	}

	#initHTML(): HTMLElement {
		this.#htmlElement = createElement('div', {
			class: 'viewer',
			childs: [
				this.#htmlCanvas = createElement('canvas') as HTMLCanvasElement,
			],
		})
		return this.#htmlElement;
	}

	#initRenderer(): void {
		Graphics.initCanvas({
			canvas: this.#htmlCanvas,
			autoResize: true,
			webGL: {
				alpha: true,
				preserveDrawingBuffer: true,
				premultipliedAlpha: false
			}
		});

		Graphics.clearColor([0.5, 0.5, 0.5, 1]);

		GraphicsEvents.addEventListener(GraphicsEvent.Tick, (event: Event) => {
			WebGLStats.tick();
			if (this.#composer?.enabled) {
				this.#composer.render((event as CustomEvent<GraphicTickEvent>).detail.delta, {});
			} else {
				Graphics.render(loadoutScene, loadoutScene.activeCamera!, (event as CustomEvent<GraphicTickEvent>).detail.delta, {});
			}
		});

		//ContextObserver.observe(GraphicsEvents, loadoutCamera);
		Graphics.play();
	}

	get htmlElement(): HTMLElement {
		return this.#htmlElement;
	}

	setCameraTarget(target: vec3): void {
		this.#orbitControl.target.setPosition(target);
	}

	getCameraTarget(): vec3 {
		return this.#orbitControl.target.getPosition();
	}

	setPolarRotation(polarRotation: boolean): void {
		if (polarRotation) {
			this.#orbitControl.minPolarAngle = -Infinity;
			this.#orbitControl.maxPolarAngle = Infinity;
		} else {
			this.#orbitControl.minPolarAngle = HALF_PI;
			this.#orbitControl.maxPolarAngle = HALF_PI;
		}
	}
}
