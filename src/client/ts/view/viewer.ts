import { vec3 } from 'gl-matrix';
import { Composer, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, HALF_PI, OrbitControl, WebGLStats } from 'harmony-3d';
import { createElement, createShadowRoot } from 'harmony-ui';
import { loadoutCamera, loadoutScene } from '../loadout/scene';
import viewerCSS from '../../css/viewer.css';

export class Viewer {
	#shadowRoot?: ShadowRoot;
	//#htmlElement!: HTMLElement;
	#htmlCanvas!: HTMLCanvasElement;
	#orbitControl;
	#composer?: Composer;

	constructor() {
		this.#orbitControl = new OrbitControl(loadoutCamera);
		loadoutCamera.setPosition([100, 0, 40]);
		this.#orbitControl.setTargetPosition([0, 0, 40]);
		this.#initRenderer();
	}

	#initHTML(): HTMLElement {
		this.#htmlCanvas = Graphics.addCanvas(undefined, {
			name: 'main_canvas',
			scene: {
				scene: loadoutScene,
				composer: this.#composer,
			},
			autoResize: true
		});

		this.#shadowRoot = createShadowRoot('div', {
			class:'Viewer',
			adoptStyle: viewerCSS,
			childs: [
				this.#htmlCanvas,
			],
		});
		return this.#shadowRoot?.host as HTMLElement;
	}

	#initRenderer(): void {
		Graphics.initCanvas({
			useOffscreenCanvas: true,
			autoResize: true,
			webGL: {
				alpha: true,
				preserveDrawingBuffer: true,
				premultipliedAlpha: false
			}
		});

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

	getHTMLElement(): HTMLElement {
		return this.#shadowRoot?.host as (HTMLElement | undefined) ?? this.#initHTML();
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
