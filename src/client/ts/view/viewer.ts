import { CanvasAttributes, ColorBackground, Composer, FullScreenQuad, Graphics, setCustomIncludeSource, ShaderManager, ShaderToyMaterial } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { JSONObject } from 'harmony-types';
import { createShadowRoot } from 'harmony-ui';
import viewerCSS from '../../css/viewer.css';
import { RECORDER_DEFAULT_FILENAME, SHADERTOY_DIRECTORY } from '../constants';
import { Controller, ControllerEvent, SetBackgroundType } from '../controller';
import { BackgroundType } from '../enums';
import { loadoutScene, orbitCamera, orbitCameraControl } from '../loadout/scene';

export class Viewer {
	#shadowRoot?: ShadowRoot;
	//#htmlElement!: HTMLElement;
	#htmlCanvas!: HTMLCanvasElement;
	#mainCanvas: CanvasAttributes | null = null;
	//#orbitControl;
	#composer?: Composer;
	#solidColorBackground = new ColorBackground();
	#shaderToyBackground?: FullScreenQuad;
	#shaderToyList?: JSONObject;
	#recording = false;

	constructor() {
		this.#initListeners();
		//this.#orbitControl = new OrbitControl(loadoutCamera);
		orbitCamera.setPosition([100, 0, 40]);
		orbitCameraControl.setTargetPosition([0, 0, 40]);
		this.#initRenderer();
	}

	#initHTML(): HTMLElement {
		this.#mainCanvas = Graphics.addCanvas(undefined, {
			name: 'main_canvas',
			scene: {
				scene: loadoutScene,
				composer: this.#composer,
			},
			autoResize: true
		});

		if (this.#mainCanvas) {
			this.#htmlCanvas = this.#mainCanvas.canvas;
		} else {
			// TODO: display error
		}


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
					loadoutScene.background = null;
					break;
				case BackgroundType.None:
					this.#setupShaderToyBackground(param as string);
					break;

				default:
					break;
			}
		});

		Controller.addEventListener(ControllerEvent.ToggleVideo, (event: Event) => {
			this.#toggleVideo((event as CustomEvent<boolean>).detail);
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

	#toggleVideo(recording: boolean): void {
		this.#recording = recording;
		if (recording) {
			this.#startRecording();
		} else {
			this.stopRecording();
		}
	}

	#startRecording(): void {
		Graphics.startRecording(60, OptionsManager.getItem('app.videorecording.bitrate'), this.#htmlCanvas);
		if (this.#mainCanvas) {
			const pictureSize = this.#getPictureSize();
			if (pictureSize) {
				this.#mainCanvas.autoResize = false;
				this.#mainCanvas.width = pictureSize.w;
				this.#mainCanvas.height = pictureSize.h;
			}
		}
	}

	stopRecording(fileName = RECORDER_DEFAULT_FILENAME): void {
		Graphics.stopRecording(fileName);
		if (this.#mainCanvas) {
			this.#mainCanvas.autoResize = true;
		}
	}

	#getPictureSize(): { w: number, h: number } | null {
		const option = OptionsManager.getItem('app.picture.size');
		if (option) {
			const regexSize = /(\d*)[\*|x|\X](\d*)/i;
			const result = regexSize.exec(option);
			if (result && result[1] && result[2]) {
				return { w: Number(result[1]), h: Number(result[2]) };
			}
		}
		return null;
	}

	#initRenderer(): void {
		/*
		Graphics.initCanvas({
			useOffscreenCanvas: true,
			autoResize: true,
			webGL: {
				alpha: true,
				preserveDrawingBuffer: true,
				premultipliedAlpha: false
			}
		});
		*/
		/*
				GraphicsEvents.addEventListener(GraphicsEvent.Tick, (event: Event) => {
					WebGLStats.tick();
						Graphics.renderMultiCanvas((event as CustomEvent<GraphicTickEvent>).detail.delta);
						/**
					} else {
						if (this.#composer?.enabled) {
							this.#composer.render((event as CustomEvent<GraphicTickEvent>).detail.delta, {});
						} else {
							Graphics.render(loadoutScene, loadoutScene.activeCamera!, (event as CustomEvent<GraphicTickEvent>).detail.delta, {});
						}
					}
					* /
				});
				*/

		//ContextObserver.observe(GraphicsEvents, loadoutCamera);
		//Graphics.play();
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
