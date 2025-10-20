import { AmbientLight, Entity, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, Group, MergeRepository, PointLight, Repositories, Source1MaterialManager, Source1ModelManager, Source1ParticleControler, Source2ModelManager, WebGLStats, WebRepository } from 'harmony-3d';
import { PaintDoneEvent, TextureCombinerEventTarget, WarpaintEditor } from 'harmony-3d-utils';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { PaintKitDefinitions } from 'harmony-tf2-utils';
import { createElement, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyTab, defineHarmonyTabGroup, documentStyle, I18n, I18nTranslation } from 'harmony-ui';
import htmlCSS from '../css/html.css';
import varsCSS from '../css/vars.css';
import english from '../json/i18n/english.json';
import optionsmanager from '../json/optionsmanager.json';
import { ENABLE_PATREON_BASE, ENABLE_PATREON_POWERUSER, PRODUCTION } from './bundleoptions';
import { ALYX_REPOSITORY, BROADCAST_CHANNEL_NAME, CSGO_REPOSITORY, DEADLOCK_REPOSITORY, DOTA2_REPOSITORY, TF2_REPOSITORY, TF2_WARPAINT_DEFINITIONS_URL } from './constants';
import { Controller, ControllerEvent } from './controller';
import { GOOGLE_ANALYTICS_ID } from './googleconstants';
import { loadoutCamera, loadoutOrbitControl, loadoutScene } from './loadout/scene';
import { AdPanel } from './view/adpanel';
import { ApplicationPanel } from './view/applicationpanel';
import { OptionsPanel } from './view/optionspanel';

documentStyle(htmlCSS);
documentStyle(varsCSS);

class Application {
	#appView = new ApplicationPanel();
	#shadowRoot?: ShadowRoot;
	#appAdPanel = new AdPanel();
	#appOptions = new OptionsPanel();

	#translations = new Map<string, I18nTranslation>();
	#broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
	#replicateCamera = false;
	#customLightsContainer?: Entity;
	#serializedEntity?: Entity;
	#lightsContainer = new Group({ name: 'Lights' });
	#ambientLight = new AmbientLight();
	#pointLights: PointLight[] = [];
	#documentStyleSheet = new CSSStyleSheet();
	#menuOrderStyleSheet = new CSSStyleSheet();
	#playing = true;
	#useBots = false;

	static {
		defineHarmonySwitch();
		defineHarmonyRadio();
		defineHarmonyTab();
		defineHarmonyTabGroup();
		PaintKitDefinitions.setWarpaintDefinitionsURL(TF2_WARPAINT_DEFINITIONS_URL);
	}

	constructor() {
		this.#updatedocumentStyleSheet();
		document.adoptedStyleSheets.push(this.#documentStyleSheet, this.#menuOrderStyleSheet);
		this.#initGraphics();
		this.#initListeners();
		//this.#initHTML();
		this.#iniRepositories();
		this.#start();
		this.#initLights();
		this.#initOptions();
		this.#setupAnalytics();
	}

	#initGraphics(): void {
		Graphics.initCanvas({
			//canvas: this.#htmlCanvas,
			useOffscreenCanvas: true,
			autoResize: true,
			webGL: {
				alpha: true,
				preserveDrawingBuffer: true,
				premultipliedAlpha: false
			}
		});

	}

	#initListeners(): void {
		this.#broadcastChannel.addEventListener('message', event => this.#processMessage(event));

		TextureCombinerEventTarget.addEventListener('paintdone', (event: Event) => {
			const paintDone = (event as CustomEvent<PaintDoneEvent>).detail;
			const name = `weapon_${String(paintDone.weaponDefIndex).padStart(5, '0')}_paint_${String(paintDone.paintKitDefId).padStart(4, '0')}_wear_${paintDone.wearLevel}_seed_${paintDone.seed}`;
			if (OptionsManager.getItem('app.warpaints.texture.save.png')) {
				paintDone.node.savePicture(name + '.png');
			}
			if (OptionsManager.getItem('app.warpaints.texture.save.vtf')) {
				paintDone.node.saveVTF(name + '.vtf');
			}
		});

		Controller.addEventListener(ControllerEvent.SetAnimSpeed, (event: Event) => {
			const speed = (event as CustomEvent<number>).detail;

			Graphics.speed = speed;
			this.#playing = speed != 0;

			this.#updatedocumentStyleSheet();
		});

		Controller.addEventListener(ControllerEvent.UseBots, (event: Event) => {
			this.#useBots = (event as CustomEvent<boolean>).detail;
			this.#updatedocumentStyleSheet();
		});

		Controller.addEventListener(ControllerEvent.ToggleOptionsManager, () => OptionsManager.showOptionsManager());
	}

	/*
	#initHTML() {
		this.#shadowRoot = createShadowRoot('div', {
			parent: document.body,
		});
		//this.#shadowRoot = this.#htmlElement.attachShadow({ mode: 'closed' });
		I18n.observeElement(this.#shadowRoot);
		this.#initCSS();

		this.#shadowRoot.append(
			//this.#appToolbar.htmlElement,
			createElement('div', {
				class: 'maincontent',
				childs: [
					//this.#appOptions.htmlElement,
					//this.#appItemSlots.htmlElement,
					createElement('div', {
						class: 'viewer-container',
						childs: [
							this.#appViewer.htmlElement,
							this.#appCharacterSelector.htmlElement,
							//this.#appMarketPrices.htmlElement,
							//this.#appStyleSelector.htmlElement,
							//this.#appUnitSelector.htmlElement,
						],
					}),
					//this.#appItemList.htmlElement,
					ENABLE_PATREON_BASE ? this.#appAdPanel.getHTMLElement() : null,
				]
			}),
			//this.#appStatusbar.htmlElement,
		);

		if (ENABLE_PATREON_POWERUSER) {
			//TODO
			//this.#shadowRoot.append(this.#appExport3DPopover?.htmlElement);
		}

		//this.#appToolbar.setMode();
	}
	*/

	/*
	#initCSS() {
		/*
		TODO
		shadowRootStyle(this.#shadowRoot!, applicationCSS);
		shadowRootStyle(this.#shadowRoot!, loadoutCSS);
		shadowRootStyle(this.#shadowRoot!, characterSelectorCSS);
		shadowRootStyle(this.#shadowRoot!, export3dPopoverCSS);
		shadowRootStyle(this.#shadowRoot!, viewerCSS);
		shadowRootStyle(this.#shadowRoot!, toolbarCSS);
		shadowRootStyle(this.#shadowRoot!, styleSelectorCSS);
		shadowRootStyle(this.#shadowRoot!, statusbarCSS);
		shadowRootStyle(this.#shadowRoot!, marketPricesCSS);
		shadowRootStyle(this.#shadowRoot!, itemSlotsCSS);
		shadowRootStyle(this.#shadowRoot!, itemListItemCSS);
		shadowRootStyle(this.#shadowRoot!, itemListCSS);
		* /
	}
	*/


	#processMessage(event: MessageEvent): void {
		if (!this.#replicateCamera) {
			return;
		}
		switch (event.data.message) {
			case 'camera_position':
				loadoutCamera.setPosition(event.data.position);
				break;
			case 'target_position':
				//this.#appViewer.setCameraTarget(event.data.position);
				loadoutOrbitControl.target.setPosition(event.data.position);
				break;
		}
	}

	#iniRepositories(): void {
		Repositories.addRepository(new MergeRepository('tf2', new WebRepository('tf2', TF2_REPOSITORY)));
		Repositories.addRepository(new WebRepository('dota2', DOTA2_REPOSITORY));
		Repositories.addRepository(new WebRepository('hla', ALYX_REPOSITORY));
		Repositories.addRepository(new WebRepository('cs2', CSGO_REPOSITORY));
		Repositories.addRepository(new WebRepository('deadlock', DEADLOCK_REPOSITORY));

		Source1ModelManager.loadManifest('tf2');
		Source1ParticleControler.loadManifest('tf2');
		Source1MaterialManager.addRepository('tf2');
		Source2ModelManager.loadManifest('dota2');
		Source2ModelManager.loadManifest('hla');
		Source2ModelManager.loadManifest('cs2');
		Source2ModelManager.loadManifest('deadlock');
	}

	#start(): void {
		this.#translations.set('english', english);
		I18n.setOptions({ translations: [english as I18nTranslation] });

		window.addEventListener('beforeunload', () => this.#beforeUnload());


		this.#startupRenderer();


		I18n.start();

	}

	#beforeUnload(): void {
		if (OptionsManager.getItem('app.cameras.orbit.saveposition')) {
			OptionsManager.setItem('app.cameras.orbit.position', (loadoutCamera.getPosition() as number[]).join(' '));
			OptionsManager.setItem('app.cameras.orbit.target', (loadoutOrbitControl.target.getPosition() as number[]).join(' '));
		}

		/*
		OptionsManager.setItem('app.lights.ambient.color', rgbToHex(vec3.copy(vec4.fromValues(1, 1, 1, 1), this.#ambientLight.color)));
		OptionsManager.setItem('app.lights.ambient.intensity', this.#ambientLight.intensity);

		for (let i = 0; i < POINT_LIGHT_COUNT; ++i) {
			let pl = this.#pointLights[i];
			let plName = 'app.lights.pointlights.' + i;
			OptionsManager.setItem(plName + '.color', rgbToHex(vec3.copy(vec4.fromValues(1, 1, 1, 1), pl.color)));
			OptionsManager.setItem(plName + '.intensity', pl.intensity);
			OptionsManager.setItem(plName + '.position', pl.position.join(' '));
			OptionsManager.setItem(plName + '.visible', pl._visible);
			OptionsManager.setItem(plName + '.castshadows', pl.castShadow);
		}
		*/

		OptionsManager.setItem('app.lights.customlights', JSON.stringify(this.#customLightsContainer?.toJSON() ?? {}));
		OptionsManager.setItem('app.sceneexplorer.misc.serialized', JSON.stringify(this.#serializedEntity?.toJSON() ?? {}));
		OptionsManager.setItem('app.warpainteditor.filter.node', WarpaintEditor.getGui().getNodeFilter());
	}

	#initLights(): void {
		loadoutScene.addChild(this.#lightsContainer);
		this.#lightsContainer.addChild(this.#ambientLight);
		this.#pointLights = [];
		for (let i = 0; i < 3; ++i) {
			this.#pointLights.push(this.#lightsContainer.addChild(new PointLight({ intensity: 0.0 })) as PointLight);
		}
	}

	#initOptions(): void {
		OptionsManagerEvents.addEventListener('app.css.theme', (event: Event) => this.setCssTheme((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		/*
		OptionsManagerEvents.addEventListener('app.backgroundcolor', (event: Event) => this.setBackgroundColor((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.backgroundcolor.red', (event: Event) => this.#setBackGroundColorRed((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.backgroundcolor.blu', (event: Event) => this.#setBackGroundColorBlu((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.verticalfov', (event: Event) => this.verticalFov = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.lang', (event: Event) => this.language = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('warpaints.texture.size', (event: Event) => TextureCombiner.setTextureSize((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.loadout.team', (event: Event) => this.changeTeam((event as CustomEvent).detail.value));

		OptionsManagerEvents.addEventListener('app.cameras.orbit.position', (event: Event) => this.perspectiveCameraPosition = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.quaternion', (event: Event) => this.perspectiveCameraQuaternion = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.target', (event: Event) => this.perspectiveCameraTarget = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.verticalfov', (event: Event) => this.perspectiveCameraVerticalFov = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.zoom', (event: Event) => this.orbitCameraZoom = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.nearplane', (event: Event) => this.perspectiveCameraNearPlane = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.farplane', (event: Event) => this.perspectiveCameraFarPlane = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.polarrotation', (event: Event) => this.polarRotation = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.orthographic', (event: Event) => this.cameraProjection = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.replicate', (event: Event) => this.#replicateCamera = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('engine.render.silhouettemode', (event: Event) => this.silhouetteMode = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('engine.render.silhouettecolor', (event: Event) => this.silhouetteColor = (event as CustomEvent).detail.value);


		let func = (event: Event) => ShortcutHandler.setShortcut((event as CustomEvent).detail.context ?? 'loadout,3dview,scene-explorer', (event as CustomEvent).detail.name, (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.shortcuts.*', func);
		OptionsManagerEvents.addEventListener('engine.shortcuts.*', func);


		OptionsManagerEvents.addEventListener('engine.shadereditor.recompiledelay', (event: Event) => this.#shaderEditor.recompileDelay = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('engine.debug.showfps', (event: Event) => { this.#showFps = (event as CustomEvent).detail.value; this.#htmlCanvasFps.innerText = ''; });


		OptionsManagerEvents.addEventListener('app.lights.ambient.color', (event: Event) => this.#ambientLight.color = hexToRgb(vec4.create(), (event as CustomEvent).detail.value) as vec3);
		OptionsManagerEvents.addEventListener('app.lights.ambient.intensity', (event: Event) => this.#ambientLight.intensity = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.lights.pointlights.*', (event: Event) => {
			let lightParams = (event as CustomEvent).detail.name.replace('app.lights.pointlights.', '').split('.');
			let light = this.#pointLights[lightParams[0]];
			if (light) {
				switch (lightParams[1]) {
					case 'position':
						light.position = stringToVec3((event as CustomEvent).detail.value);
						break;
					case 'color':
						light.color = hexToRgb(vec4.create(), (event as CustomEvent).detail.value) as vec3;
						break;
					case 'visible':
						light.setVisible((event as CustomEvent).detail.value ? undefined : false);
						break;
					case 'castshadows':
						light.castShadow = (event as CustomEvent).detail.value ? undefined : false;
						break;
					default:
						(light as any/*TODO: fix me* /)[lightParams[1]] = (event as CustomEvent).detail.value;
				}
			}
		});
		OptionsManagerEvents.addEventListener('app.audio.mute.*', (event: Event) => this.muteSound((event as CustomEvent).detail.name.replace('app.audio.mute.', ''), (event as CustomEvent).detail.value));

		OptionsManagerEvents.addEventListener('engine.shaders.defines.*', async (event: Event) => {
			let defineName = (event as CustomEvent).detail.name.replace('engine.shaders.defines.', '');
			let defineType = await OptionsManagerEvents.getOptionType((event as CustomEvent).detail.name);
			if (defineType == 'boolean') {
				if ((event as CustomEvent).detail.value == true) {
					Graphics.setIncludeCode('option_' + defineName, '#define ' + defineName.toUpperCase());
				} else {
					Graphics.removeIncludeCode('option_' + defineName);
				}
			} else {
				Graphics.setIncludeCode('option_' + defineName, '#define ' + defineName.toUpperCase() + ' ' + (event as CustomEvent).detail.value);
			}
		});

		OptionsManagerEvents.addEventListener('app.lights.rotatewithcamera', (event: Event) => {
			this.#lightsRotateWithCamera = (event as CustomEvent).detail.value;
			quat.identity(this.#lightsContainer._quaternion);
		});

		OptionsManagerEvents.addEventListener('app.characters.highlightselected', (event) => this.showHighLights(true));

		OptionsManagerEvents.addEventListener('app.lights.renderlights', (event: Event) => {
			if ((event as CustomEvent).detail.value) {
				Graphics.removeIncludeCode('renderlights');
			} else {
				Graphics.setIncludeCode('renderlights', '#define SKIP_LIGHTING');
			}
		});


		OptionsManagerEvents.addEventListener('app.map.rendermap', (event: Event) => {
			if (this.#map) {
				this.#map.setVisible((event as CustomEvent).detail.value);
			}
		});


		OptionsManagerEvents.addEventListener('app.effects.renderparticles', (event: Event) => Source1ParticleControler.renderSystems = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('engine.shadows.quality', (event: Event) => {
			Light.defaultTextureSize = (event as CustomEvent).detail.value;
			let lightList = this.#scene.getChildList('Light');

			for (let light of lightList) {
				(light as Light).shadowTextureSize = (event as CustomEvent).detail.value;
			}
		});

		OptionsManagerEvents.addEventListener('*', (event: Event) => {
			if ((event as CustomEvent).detail.name.startsWith('app.css.variables.')) {
				document.documentElement.style.setProperty('--' + (event as CustomEvent).detail.name.split('app.css.variables.')[1], (event as CustomEvent).detail.value);
			}
		});

		OptionsManagerEvents.addEventListener('app.lights.customlights', async (event: Event) => {
			this.#scene.removeChild(this.#customLightsContainer);
			this.#customLightsContainer = await JSONLoader.fromJSON(JSON.parse((event as CustomEvent).detail.value)) as Entity;
			this.#scene.addChild(this.#customLightsContainer);
			this.#customLightsContainer.setVisible(OptionsManagerEvents.getItem('app.lights.usecustomlights'));
		});

		OptionsManagerEvents.addEventListener('app.sceneexplorer.misc.serialized', async (event: Event) => {
			this.#scene.removeChild(this.#serializedEntity);
			this.#serializedEntity = await JSONLoader.fromJSON(JSON.parse((event as CustomEvent).detail.value)) as Entity;
			this.#scene.addChild(this.#serializedEntity);
		});

		OptionsManagerEvents.addEventListener('app.sceneexplorer.skeleton.jointradius', async (event: Event) => getSceneExplorer().setJointsRadius((event as CustomEvent).detail.value));

		OptionsManagerEvents.addEventListener('app.lights.usecustomlights', (event: Event) => {
			if (this.#customLightsContainer) {
				this.#customLightsContainer.setVisible((event as CustomEvent).detail.value);
			}
			if ((event as CustomEvent).detail.value) {
				this.#lightsContainer?.setVisible(false);
				this.#mapLightsContainer?.setVisible(false);
			} else {
				this.#lightsContainer?.setVisible(undefined);
			}
		});

		OptionsManagerEvents.addEventListener('app.postprocessing.enabled', (event: Event) => this.#composer && (this.#composer.enabled = (event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.enabled', (event: Event) => this.#pixelatePass.enabled = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.horizontaltiles', (event: Event) => this.#pixelatePass.horizontalTiles = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.pixelstyle', (event: Event) => this.#pixelatePass.pixelStyle = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.saturate.enabled', (event: Event) => this.#saturatePass.enabled = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.saturate.saturation', (event: Event) => this.#saturatePass.saturation = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.crosshatch.enabled', (event: Event) => this.#crosshatchPass.enabled = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.palette.enabled', (event: Event) => this.#palettePass.enabled = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.grain.enabled', (event: Event) => this.#grainPass.enabled = (event as CustomEvent).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.grain.intensity', (event: Event) => this.#grainPass.intensity = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.sketch.enabled', (event: Event) => this.#sketchPass.enabled = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.oldmovie.enabled', (event: Event) => this.#oldMoviePass.enabled = (event as CustomEvent).detail.value);

		OptionsManagerEvents.addEventListener('engine.particles.speed', (event: Event) => Source1ParticleSystem.setSpeed((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('engine.particles.simulationsteps', (event: Event) => Source1ParticleSystem.setSimulationSteps((event as CustomEvent).detail.value));
		OptionsManagerEvents.addEventListener('engine.particles.simulationrate', (event: Event) => this.#setParticlesRate());
		OptionsManagerEvents.addEventListener('engine.particles.usefixedrate', (event: Event) => this.#setParticlesRate());
		*/

		OptionsManagerEvents.addEventListener('app.ui.class.menuorder', (event: Event) => this.#setClassOrder((event as CustomEvent).detail.value));

		/*
		OptionsManagerEvents.addEventListener('app.characters.scout.bluepants', (event: Event) => this.#setScoutBluePants((event as CustomEvent).detail.value));

		OptionsManagerEvents.addEventListener('app.warpainteditor.filter.node', (event: Event) => new WarpaintEditor().getGui().setNodeFilter((event as CustomEvent).detail.value));

		OptionsManagerEvents.addEventListener('app.usespeechrecognition', (event: Event) => {
			if ((event as CustomEvent).detail.value) {
				this.#speech.start();
			} else {
				this.#speech.stop();
			}
		});

		OptionsManagerEvents.addEventListener('app.engine.source1.newanimationsystem', (event: Event) => {
			Source1ModelInstance.useNewAnimSystem = (event as CustomEvent).detail.value;
		});

		/*

		OptionsManagerEvents.addEventListener('engine.debug.showfps', function(event) {SourceEngine.ready().then(() => SourceEngine.webGlCanvas.showFPS = (event as CustomEvent).detail.value)});
		OptionsManagerEvents.addEventListener('app.picture.size', function(event) {pictureSizeSelector.value = (event as CustomEvent).detail.value;});

		OptionsManagerEvents.addEventListener('engine.render.particles', event => {SourceEngine.ready().then(() => SourceEngine.ParticleControler.enabled = (event as CustomEvent).detail.value)});
		OptionsManagerEvents.addEventListener('engine.performance.fpscap', event => {SourceEngine.ready().then(() => SourceEngine.Settings.Engine.fpsCap = (event as CustomEvent).detail.value)});
		OptionsManagerEvents.addEventListener('*', event => {if ((event as CustomEvent).detail.name.startsWith('app.css.variables.')) {SetCssVariable((event as CustomEvent).detail.name.split('app.css.variables.')[1], (event as CustomEvent).detail.value)}});
*/

		OptionsManager.init({ json: optionsmanager }).then(() => this.#initOptions2());
	}

	#initOptions2(): void {
		//change the default value in optionsmanager.json accordingly
		let currentVersion = 0;

		const storedVersion = OptionsManager.getItem('app.options.version');
		if (storedVersion <= currentVersion || storedVersion == undefined) {
			this.#resetCamera();
			OptionsManager.resetItem('app.lights.ambient.intensity');
			OptionsManager.resetItem('app.lights.pointlights.0.intensity');
			OptionsManager.resetItem('app.options.version');
			OptionsManager.setItem('app.options.version', ++currentVersion);
		}
	}

	#resetCamera(): void {
		OptionsManager.resetItem('app.cameras.orbit.position');
		OptionsManager.resetItem('app.cameras.orbit.quaternion');
		OptionsManager.resetItem('app.cameras.orbit.target');
		loadoutScene.addChild(loadoutCamera);
	}

	#setupAnalytics(): void {
		if (PRODUCTION && ENABLE_PATREON_BASE) {
			createElement('script', {
				src: `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`,
				parent: document.body,
				async: 1,
			});
			createElement('script', {
				innerText: `window.dataLayer = window.dataLayer || [];
				function gtag(){dataLayer.push(arguments);}
				gtag('js', new Date());

				gtag('config', '${GOOGLE_ANALYTICS_ID}');`,
				parent: document.body,
			});
		}
	}

	setCssTheme(theme: string): void {
		document.documentElement.classList.remove('dark');
		document.documentElement.classList.remove('light');

		if (theme == 'dark' || theme == 'light') {
			document.documentElement.classList.add(theme);
		}

		//this.#htmlCSSTheme?.select(theme, true);
	}

	#startupRenderer(): void {
		const animate = (event: Event): void => {
			WebGLStats.tick();
			/*if (this.#composer?.enabled) {
				this.#composer.render((event as CustomEvent).detail.delta, {});
			} else */{
				//Graphics.render(this.#scene, this.#scene.activeCamera ?? this.#activeCamera, (event as CustomEvent).detail.delta, {});
				Graphics.renderMultiCanvas((event as CustomEvent<GraphicTickEvent>).detail.delta);
			}
			/*
			if (this.#recording) {
				this.recordFrame();
			}
			*/
			/*
			if (this.#showFps) {
				this.#htmlCanvasFps.innerText = String(WebGLStats.getFps());
			}
			*/

			/*
			if (this.#lightsRotateWithCamera) {
				let v = vec3.clone(this.#orbitCamera.position);
				v[2] = 0;
				//this.#lightsContainer.lookAt(this.#orbitCamera.position);
				vec3.normalize(v, v);
				quat.rotationTo(this.#lightsContainer._quaternion, [0, -1, 0], v);
			}
			*/
		}
		Graphics.play();
		GraphicsEvents.addEventListener(GraphicsEvent.Tick, animate);
		//GraphicsEvents.addEventListener(GraphicsEvent.Tick, (event: Event) => this.#activeCameraControl.update((event as CustomEvent).detail.delta));

		//ContextObserver.observe(GraphicsEvents, this.#orbitCamera);
		//ContextObserver.observe(GraphicsEvents, this.#firstPersonCamera);
	}

	#updatedocumentStyleSheet(): void {
		this.#documentStyleSheet.replaceSync(`html{
--playing: ${this.#playing ? 1 : 0};
--use-bots: ${this.#useBots ? 1 : 0};
--poweruser: ${ENABLE_PATREON_POWERUSER ? 1 : 0}
}`);
	}

	#setClassOrder(menuOrder: boolean): void {
		const order: Record<string, number> = { scout: 0, sniper: 7, soldier: 1, demoman: 3, medic: 6, heavy: 4, pyro: 2, spy: 8, engineer: 5 };
		let variables = '';
		if (menuOrder) {
			for (const npc in order) {
				variables += `--tf2-class-order-${npc}: ${String(order[npc])};`;
			}
		}
		this.#menuOrderStyleSheet.replaceSync(`html{${variables}}`);
	}
}
new Application();
