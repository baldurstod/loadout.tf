import { CanvasAttributes, ColorBackground, Composer, CopyPass, CrosshatchPass, FullScreenQuad, GrainPass, Graphics, GraphicsEvent, GraphicsEvents, OldMoviePass, PalettePass, PixelatePass, RenderPass, SaturatePass, setCustomIncludeSource, ShaderManager, ShaderToyMaterial, SketchPass, WebGLStats } from 'harmony-3d';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents, ShortcutHandler } from 'harmony-browser-utils';
import { JSONObject } from 'harmony-types';
import { createElement, createShadowRoot } from 'harmony-ui';
import viewerCSS from '../../css/viewer.css';
import { LOADOUT_LAYOUT, MAIN_CANVAS, RECORDER_DEFAULT_FILENAME, SHADERTOY_DIRECTORY } from '../constants';
import { Controller, ControllerEvent, SetBackgroundType } from '../controller';
import { BackgroundType } from '../enums';
import { weaponLayout } from '../loadout/comparewarpaints';
import { loadoutScene, orbitCamera, orbitCameraControl } from '../loadout/scene';

export class Viewer {
	#shadowRoot?: ShadowRoot;
	//#htmlElement!: HTMLElement;
	#htmlCanvas!: HTMLCanvasElement;
	#mainCanvas: CanvasAttributes | null = null;
	#htmlCanvasFps?: HTMLElement;
	//#orbitControl;
	#composer = new Composer();
	#pixelatePass = new PixelatePass(orbitCamera);
	#grainPass = new GrainPass(orbitCamera);
	#saturatePass = new SaturatePass(orbitCamera);
	#crosshatchPass = new CrosshatchPass(orbitCamera);
	#palettePass = new PalettePass(orbitCamera);
	#sketchPass = new SketchPass(orbitCamera);
	#oldMoviePass = new OldMoviePass(orbitCamera);
	#solidColorBackground = new ColorBackground();
	#shaderToyBackground?: FullScreenQuad;
	#shaderToyList?: JSONObject;
	#recording = false;
	#showFps = false;

	constructor() {
		this.#initPostProcessing();
		this.#initListeners();
		//this.#orbitControl = new OrbitControl(loadoutCamera);
		orbitCamera.setPosition([100, 0, 40]);
		orbitCameraControl.setTargetPosition([0, 0, 40]);
		this.#initRenderer();
	}

	#initHTML(): HTMLElement {
		this.#mainCanvas = Graphics.addCanvas({
			name: MAIN_CANVAS,
			layouts: [
				{
					name: LOADOUT_LAYOUT,
					views: [
						{
							scene: loadoutScene,
							composer: this.#composer,
						},
					],
				},
				weaponLayout,
			],
			autoResize: true,
			useLayout: LOADOUT_LAYOUT,
		});

		if (this.#mainCanvas) {
			this.#htmlCanvas = this.#mainCanvas.canvas;
			ShortcutHandler.addContext('3dview', this.#htmlCanvas);
		} else {
			// TODO: display error
		}


		this.#shadowRoot = createShadowRoot('div', {
			class: 'Viewer',
			adoptStyle: viewerCSS,
			childs: [
				this.#htmlCanvas,
				this.#htmlCanvasFps = createElement('div', { class: 'fps' }),
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

		Controller.addEventListener(ControllerEvent.SavePicture, () => this.#savePicture());

		Controller.addEventListener(ControllerEvent.UseLayout, (event: Event) => this.#useLayout((event as CustomEvent<string>).detail));

		ShortcutHandler.addEventListener('app.shortcuts.video.togglerecording', () => this.#toggleVideo(!this.#recording));

		GraphicsEvents.addEventListener(GraphicsEvent.Tick, () => {

			if (this.#showFps && this.#htmlCanvasFps) {
				this.#htmlCanvasFps.innerText = String(WebGLStats.getFps());
			}

		});

		OptionsManagerEvents.addEventListener('engine.debug.showfps', (event: Event) => {
			this.#showFps = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean;
			if (this.#htmlCanvasFps) {
				this.#htmlCanvasFps.innerText = '';
			}
		});

		OptionsManagerEvents.addEventListener('app.postprocessing.enabled', (event: Event) => this.#composer && (this.#composer.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean));
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.enabled', (event: Event) => this.#pixelatePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.horizontaltiles', (event: Event) => this.#pixelatePass.horizontalTiles = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.pixelstyle', (event: Event) => this.#pixelatePass.pixelStyle = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);

		OptionsManagerEvents.addEventListener('app.postprocessing.saturate.enabled', (event: Event) => this.#saturatePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);
		OptionsManagerEvents.addEventListener('app.postprocessing.saturate.saturation', (event: Event) => this.#saturatePass.saturation = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);

		OptionsManagerEvents.addEventListener('app.postprocessing.crosshatch.enabled', (event: Event) => this.#crosshatchPass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		OptionsManagerEvents.addEventListener('app.postprocessing.palette.enabled', (event: Event) => this.#palettePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		OptionsManagerEvents.addEventListener('app.postprocessing.grain.enabled', (event: Event) => this.#grainPass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);
		OptionsManagerEvents.addEventListener('app.postprocessing.grain.intensity', (event: Event) => this.#grainPass.intensity = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);

		OptionsManagerEvents.addEventListener('app.postprocessing.sketch.enabled', (event: Event) => this.#sketchPass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		OptionsManagerEvents.addEventListener('app.postprocessing.oldmovie.enabled', (event: Event) => this.#oldMoviePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);
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

	#initPostProcessing(): void {
		const renderPass = new RenderPass(loadoutScene, orbitCamera);

		const copyPass = new CopyPass(orbitCamera);

		this.#composer.addPass(renderPass);
		this.#composer.addPass(this.#grainPass);
		this.#composer.addPass(this.#saturatePass);
		this.#composer.addPass(this.#crosshatchPass);
		this.#composer.addPass(this.#palettePass);
		this.#composer.addPass(this.#sketchPass);
		this.#composer.addPass(this.#pixelatePass);
		this.#composer.addPass(this.#oldMoviePass);
		this.#composer.addPass(copyPass);

		this.#composer.enabled = OptionsManager.getItem('app.postprocessing.enabled');
	}

	/*
	setCameraTarget(target: vec3): void {
		this.#orbitControl.target.setPosition(target);
	}

	getCameraTarget(): vec3 {
		return this.#orbitControl.target.getPosition();
	}
	*/
	#savePicture(): void {
		const value = this.#getPictureSize();
		this.#showHighLights(false);
		Graphics.exportCanvas(MAIN_CANVAS, 'loadout.png', value?.w, value?.h);
		this.#showHighLights(true);
	}

	#showHighLights(show: boolean): void {
		show = show && OptionsManager.getItem('app.characters.highlightselected');
		if (show) {
			Graphics.setIncludeCode('showHighLights', '#define RENDER_HIGHLIGHT');
		} else {
			Graphics.setIncludeCode('showHighLights', '#undef RENDER_HIGHLIGHT');
		}
	}

	#useLayout(layout: string): void {
		if (this.#mainCanvas) {
			this.#mainCanvas.useLayout = layout;
		}
	}
}
