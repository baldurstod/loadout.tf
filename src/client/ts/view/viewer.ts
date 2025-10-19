import { ColorBackground, Composer, FullScreenQuad, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, setCustomIncludeSource, ShaderManager, ShaderToyMaterial, WebGLStats } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { createShadowRoot } from 'harmony-ui';
import viewerCSS from '../../css/viewer.css';
import { SHADERTOY_DIRECTORY } from '../constants';
import { Controller, ControllerEvent, SetBackgroundType } from '../controller';
import { BackgroundType } from '../enums';
import { loadoutCamera, loadoutOrbitControl, loadoutScene } from '../loadout/scene';

export class Viewer {
	#shadowRoot?: ShadowRoot;
	//#htmlElement!: HTMLElement;
	#htmlCanvas!: HTMLCanvasElement;
	//#orbitControl;
	#composer?: Composer;
	#solidColorBackground = new ColorBackground();
	#shaderToyBackground?: FullScreenQuad;
	#shaderToyList?: JSONObject;

	constructor() {
		this.#initListeners();
		//this.#orbitControl = new OrbitControl(loadoutCamera);
		loadoutCamera.setPosition([100, 0, 40]);
		loadoutOrbitControl.setTargetPosition([0, 0, 40]);
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
			class: 'Viewer',
			adoptStyle: viewerCSS,
			childs: [
				this.#htmlCanvas,
			],
		});
		return this.#shadowRoot?.host as HTMLElement;
	}

	#initListeners(): void {
		Controller.addEventListener(ControllerEvent.SetBackgroundType, (event: Event) => {
			const type = (event as CustomEvent<SetBackgroundType>).detail.type;
			const param = (event as CustomEvent<SetBackgroundType>).detail.param;
			switch (type) {
				case BackgroundType.None:
					loadoutScene.background = undefined;
					break;
				case BackgroundType.None:
					this.#setupShaderToyBackground(param as string);
					break;

				default:
					break;
			}

		});
	}

	async #setupShaderToyBackground(shaderName: string): Promise<void> {
		/*
		show(this.#htmlShaderToy);
		if (!this.#shaderToyList) {
			let shaderToyList = await (await fetch(SHADERTOY_DIRECTORY + 'list.json')).json();
			if (shaderToyList) {
				for (let key in shaderToyList) {
					let option = createElement('option', { innerHTML: key, value: key }) as HTMLOptionElement;
					this.#htmlShaderToyList?.append(option);
				}
			}
			this.#shaderToyList = shaderToyList;
		}
			*/

		if (!this.#shaderToyBackground) {
			this.#shaderToyBackground = new FullScreenQuad();
			this.#shaderToyBackground.hideInExplorer = true;
			this.#shaderToyBackground.castShadow = false;
			this.#shaderToyBackground.receiveShadow = false;

			loadoutScene.addChild(this.#shaderToyBackground);


			const material = new ShaderToyMaterial();
			this.#shaderToyBackground.setMaterial(material);

			/*let sourceName = 'shadertoy_' + Date.now();
			material.shaderSource = sourceName;
			Shaders[sourceName + '.vs'] = Shaders['shadertoy.vs'];
			Shaders[sourceName + '.fs'] = Shaders['shadertoy.fs'];*/
		} else {
			this.#shaderToyBackground.setVisible(undefined);
		}

		if (shaderName && this.#shaderToyList) {
			const value = this.#shaderToyList[shaderName];
			if (typeof value == 'object') {
				const defines = (value as JSONObject).defines as JSONObject;
				if (defines) {
					for (const key in defines) {
						this.#shaderToyBackground.setDefine(key, defines[key] as string);
					}
				}
				shaderName = (value as JSONObject).name as string;
				//hide(this.#htmlShaderToyLink);
			} else {
				/*
				shaderName = value as string;
				let href = SHADERTOY_VIEW_URL + value;
				this.#htmlShaderToyLink.href = href;
				this.#htmlShaderToyLink.innerHTML = href;
				show(this.#htmlShaderToyLink);
				*/
			}

			setCustomIncludeSource('shadertoy_code', await (await fetch(SHADERTOY_DIRECTORY + shaderName)).text());
			ShaderManager.resetShadersSource();
			Graphics.invalidateShaders();
		}
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

	/*
	setCameraTarget(target: vec3): void {
		this.#orbitControl.target.setPosition(target);
	}

	getCameraTarget(): vec3 {
		return this.#orbitControl.target.getPosition();
	}
	*/
}
