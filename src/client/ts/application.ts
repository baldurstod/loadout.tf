import { vec3, vec4 } from 'gl-matrix';
import { AmbientLight, CameraProjection, Entity, exportToBinaryFBX, getSceneExplorer, Graphics, GraphicsEvent, GraphicsEvents, GraphicTickEvent, Group, HALF_PI, JSONLoader, Light, MergeRepository, ObjExporter, PointLight, Repositories, setFetchFunction, Source1MaterialManager, Source1ModelInstance, Source1ModelManager, Source1ParticleControler, Source1ParticleSystem, Source2ModelManager, SourceBSP, stringToQuat, stringToVec3, WebGLStats, WebRepository } from 'harmony-3d';
import { PaintDoneEvent, TextureCombiner, TextureCombinerEventTarget, WarpaintEditor, WeaponManager } from 'harmony-3d-utils';
import { addNotification, NotificationsPlacement, NotificationType, OptionsManager, OptionsManagerEvent, OptionsManagerEvents, saveFile, setNotificationsPlacement, ShortcutHandler } from 'harmony-browser-utils';
import { PaintKitDefinitions } from 'harmony-tf2-utils';
import { JSONObject } from 'harmony-types';
import { createElement, defineHarmonyRadio, defineHarmonySwitch, defineHarmonyTab, defineHarmonyTabGroup, documentStyle, I18n, I18nTranslation } from 'harmony-ui';
import { setTimeoutPromise } from 'harmony-utils';
import htmlCSS from '../css/html.css';
import varsCSS from '../css/vars.css';
import english from '../json/i18n/english.json';
import optionsmanager from '../json/optionsmanager.json';
import { ENABLE_PATREON_BASE, ENABLE_PATREON_POWERUSER, PATREON_IS_LOGGED, PRODUCTION } from './bundleoptions';
import { ALYX_REPOSITORY, BROADCAST_CHANNEL_NAME, CSGO_REPOSITORY, DEADLOCK_REPOSITORY, DOTA2_REPOSITORY, SCOUT_BLUE_PANTS_DEST, SCOUT_BLUE_PANTS_ORIGIN, TF2_COMPETITIVE_STAGE, TF2_GROUP_URL, TF2_REPOSITORY, TF2_WARPAINT_DEFINITIONS_URL, TF2_WARPAINT_ENGLISH_URL } from './constants';
import { Controller, ControllerEvent, ShowBadge } from './controller';
import { CameraType, Panel } from './enums';
import { GOOGLE_ANALYTICS_ID } from './googleconstants';
import { CharacterManager } from './loadout/characters/charactermanager';
import { Tf2Class } from './loadout/characters/characters';
import { Team } from './loadout/enums';
import { Loadout } from './loadout/loadout';
import { addTF2Model, customLightsContainer, lightsContainer, loadoutColorBackground, loadoutScene, orbitCamera, orbitCameraControl, setActiveCamera, setCustomLightsContainer } from './loadout/scene';
import { LoadoutSpeech } from './loadout/speech/speech';
import { ApplicationPanel } from './view/applicationpanel';

documentStyle(htmlCSS);
documentStyle(varsCSS);

class Application {
	#appView = new ApplicationPanel();

	#translations = new Map<string, I18nTranslation>();
	#broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
	#replicateCamera = false;
	//#customLightsContainer?: Entity;
	#serializedEntity?: Entity;
	//readonly #lightsContainer = new Group({ name: 'Lights' });
	#mapLightsContainer = new Group({ name: 'Photo studio lights', parent: loadoutScene });
	#ambientLight = new AmbientLight();
	#pointLights: PointLight[] = [];
	#competitiveStage?: Source1ModelInstance;
	#documentStyleSheet = new CSSStyleSheet();
	#menuOrderStyleSheet = new CSSStyleSheet();
	#playing = true;
	#useBots = false;
	#backgroundColor = vec4.create();
	#backgroundColorRed?: vec4;
	#backgroundColorBlu?: vec4;
	#map?: SourceBSP;
	#initPaintKitsPromise?: Promise<void>;
	#zipEntries = new Map<string, Blob>();
	#fetchRedirect = new Map<string, string>();
	#speech = new LoadoutSpeech();

	static {
		defineHarmonySwitch();
		defineHarmonyRadio();
		defineHarmonyTab();
		defineHarmonyTabGroup();
		PaintKitDefinitions.setWarpaintDefinitionsURL(TF2_WARPAINT_DEFINITIONS_URL);
	}

	constructor() {
		setNotificationsPlacement(NotificationsPlacement.Bottom);
		this.#updatedocumentStyleSheet();
		document.adoptedStyleSheets.push(this.#documentStyleSheet, this.#menuOrderStyleSheet);
		this.#initGraphics();
		this.#initListeners();
		//this.#initHTML();
		this.#iniRepositories();
		this.#start();
		this.#initLights();
		this.#initOptions();
		this.#initShortcuts();
		this.#setupAnalytics();
		this.#initDefaultCharacter();

		setFetchFunction(async (resource, options) => {
			let res2 = resource;
			if (typeof resource == 'string') {
				res2 = new URL(resource);
			} else if (resource instanceof Request) {
				res2 = new URL(resource.url);
			}

			const entryPath = (res2 as URL).pathname.replace(/^\//, '');
			const entry = this.#zipEntries.get(entryPath);
			if (entry) {
				return new Response(entry)
			}
			const entry2 = this.#fetchRedirect.get(entryPath);
			if (entry2) {
				return fetch(entry2, options);
			}
			return fetch(resource, options);
		})
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

		Controller.addEventListener(ControllerEvent.SelectCharacter, (event: Event) => {
			const tf2Class = (event as CustomEvent<Tf2Class>).detail;

			CharacterManager.selectCharacter(tf2Class);
		});

		Controller.addEventListener(ControllerEvent.SelectCamera, (event: Event) => setActiveCamera((event as CustomEvent<CameraType>).detail));
		Controller.addEventListener(ControllerEvent.ResetCamera, () => this.#resetCamera());

		Controller.addEventListener(ControllerEvent.ShowCompetitiveStage, (event: Event) => { this.#showCompetitiveStage((event as CustomEvent<boolean>).detail); return; });

		Controller.addEventListener(ControllerEvent.ShowBadge, (event: Event) => { Loadout.showBadge((event as CustomEvent<ShowBadge>).detail.level, (event as CustomEvent<ShowBadge>).detail.tier); return; });

		Controller.addEventListener(ControllerEvent.WarpaintClick, () => { this.#initWarpaints(); return; });

		Controller.addEventListener(ControllerEvent.ShowAboutNotification, () => this.#showAboutLayer());
		Controller.addEventListener(ControllerEvent.ShowBugNotification, () => this.#showBugNotification());
		Controller.addEventListener(ControllerEvent.PatreonClick, () => this.#handlePatreonClick());
		Controller.addEventListener(ControllerEvent.ExportFbx, () => this.#exportToFBX());
		Controller.addEventListener(ControllerEvent.Export3d, (event: Event) => this.#export3D((event as CustomEvent<boolean>).detail));
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
				orbitCamera.setPosition(event.data.position);
				break;
			case 'target_position':
				//this.#appViewer.setCameraTarget(event.data.position);
				orbitCameraControl.target.setPosition(event.data.position);
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
			OptionsManager.setItem('app.cameras.orbit.position', (orbitCamera.getPosition() as number[]).join(' '));
			OptionsManager.setItem('app.cameras.orbit.target', (orbitCameraControl.target.getPosition() as number[]).join(' '));
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

		OptionsManager.setItem('app.lights.customlights', JSON.stringify(customLightsContainer?.toJSON() ?? {}));
		OptionsManager.setItem('app.sceneexplorer.misc.serialized', JSON.stringify(this.#serializedEntity?.toJSON() ?? {}));
		OptionsManager.setItem('app.warpainteditor.filter.node', WarpaintEditor.getGui().getNodeFilter());
	}

	#initLights(): void {
		loadoutScene.addChild(lightsContainer);
		lightsContainer.addChild(this.#ambientLight);
		this.#pointLights = [];
		for (let i = 0; i < 3; ++i) {
			this.#pointLights.push(lightsContainer.addChild(new PointLight({ intensity: 0.0 })) as PointLight);
		}
	}

	#initOptions(): void {
		OptionsManagerEvents.addEventListener('app.css.theme', (event: Event) => this.setCssTheme((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('app.backgroundcolor', (event: Event) => this.#setBackgroundColor((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('app.backgroundcolor.red', (event: Event) => this.#setBackGroundColorRed((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('app.backgroundcolor.blu', (event: Event) => this.#setBackGroundColorBlu((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.verticalfov', (event: Event) => this.#setVerticalFov((event as CustomEvent<OptionsManagerEvent>).detail.value as number));
		OptionsManagerEvents.addEventListener('app.lang', (event: Event) => this.#setLang((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('warpaints.texture.size', (event: Event) => TextureCombiner.setTextureSize((event as CustomEvent<OptionsManagerEvent>).detail.value as number));
		OptionsManagerEvents.addEventListener('app.loadout.team', (event: Event) => this.setTeam((event as CustomEvent<OptionsManagerEvent>).detail.value as number));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.position', (event: Event) => this.#setPerspectiveCameraPosition((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.quaternion', (event: Event) => this.#setPerspectiveCameraQuaternion((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.target', (event: Event) => this.#setPerspectiveCameraTarget((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.zoom', (event: Event) => orbitCamera.orthoZoom = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.nearplane', (event: Event) => orbitCamera.nearPlane = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.farplane', (event: Event) => orbitCamera.farPlane = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);
		OptionsManagerEvents.addEventListener('app.cameras.orbit.polarrotation', (event: Event) => this.#setPolarRotation((event as CustomEvent<OptionsManagerEvent>).detail.value as boolean));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.orthographic', (event: Event) => orbitCamera.setProjection(((event as CustomEvent<OptionsManagerEvent>).detail.value as boolean) ? CameraProjection.Orthographic : CameraProjection.Perspective));
		OptionsManagerEvents.addEventListener('app.cameras.orbit.replicate', (event: Event) => this.#replicateCamera = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);
		OptionsManagerEvents.addEventListener('engine.render.silhouettemode', (event: Event) => this.#setSilhouetteMode((event as CustomEvent<OptionsManagerEvent>).detail.value as boolean));
		OptionsManagerEvents.addEventListener('engine.render.silhouettecolor', (event: Event) => this.#setSilhouetteColor((event as CustomEvent<OptionsManagerEvent>).detail.value as string));


		const func = (event: Event): void => ShortcutHandler.setShortcut((event as CustomEvent<OptionsManagerEvent>).detail.context ?? 'loadout,3dview,scene-explorer', (event as CustomEvent<OptionsManagerEvent>).detail.name, (event as CustomEvent<OptionsManagerEvent>).detail.value as string);
		OptionsManagerEvents.addEventListener('app.shortcuts.*', func);
		OptionsManagerEvents.addEventListener('engine.shortcuts.*', func);


		OptionsManagerEvents.addEventListener('app.lights.ambient.color', (event: Event) => this.#ambientLight.color = hexToRgba(vec4.create(), (event as CustomEvent<OptionsManagerEvent>).detail.value as string) as vec3);
		OptionsManagerEvents.addEventListener('app.lights.ambient.intensity', (event: Event) => this.#ambientLight.intensity = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);

		OptionsManagerEvents.addEventListener('app.lights.pointlights.*', (event: Event) => {
			const lightParams = (event as CustomEvent<OptionsManagerEvent>).detail.name.replace('app.lights.pointlights.', '').split('.');
			const light = this.#pointLights[Number(lightParams[0]!)];
			if (light) {
				switch (lightParams[1]) {
					case 'position':
						light.setPosition(stringToVec3((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
						break;
					case 'color':
						light.color = hexToRgba(vec4.create(), (event as CustomEvent<OptionsManagerEvent>).detail.value as string) as vec3;
						break;
					case 'visible':
						light.setVisible((event as CustomEvent<OptionsManagerEvent>).detail.value ? undefined : false);
						break;
					case 'castshadows':
						light.castShadow = (event as CustomEvent<OptionsManagerEvent>).detail.value ? undefined : false;
						break;
					default:
						(light as any/*TODO: fix me*/)[lightParams[1]!] = (event as CustomEvent<OptionsManagerEvent>).detail.value;
				}
			}
		});

		OptionsManagerEvents.addEventListener('engine.shaders.defines.*', (event: Event): void => {
			(async (): Promise<void> => {
				const defineName = (event as CustomEvent<OptionsManagerEvent>).detail.name.replace('engine.shaders.defines.', '');
				const defineType = await OptionsManager.getOptionType((event as CustomEvent<OptionsManagerEvent>).detail.name);
				if (defineType == 'boolean') {
					if ((event as CustomEvent<OptionsManagerEvent>).detail.value == true) {
						Graphics.setIncludeCode('option_' + defineName, '#define ' + defineName.toUpperCase());
					} else {
						Graphics.removeIncludeCode('option_' + defineName);
					}
				} else {
					Graphics.setIncludeCode('option_' + defineName, '#define ' + defineName.toUpperCase() + ' ' + ((event as CustomEvent<OptionsManagerEvent>).detail.value as string));
				}
			})()
		});

		/*
		OptionsManagerEvents.addEventListener('app.lights.rotatewithcamera', (event: Event) => {
			this.#lightsRotateWithCamera = (event as CustomEvent<OptionsManagerEvent>).detail.value;
			quat.identity(lightsContainer._quaternion);
		});

		*/
		OptionsManagerEvents.addEventListener('app.characters.highlightselected', () => this.#showHighLights(true));

		OptionsManagerEvents.addEventListener('app.lights.renderlights', (event: Event) => {
			if ((event as CustomEvent<OptionsManagerEvent>).detail.value as boolean) {
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


		OptionsManagerEvents.addEventListener('app.effects.renderparticles', (event: Event) => Source1ParticleControler.renderSystems = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		OptionsManagerEvents.addEventListener('engine.shadows.quality', (event: Event) => {
			Light.defaultTextureSize = (event as CustomEvent<OptionsManagerEvent>).detail.value as number;
			const lightList = loadoutScene.getChildList('Light');

			for (const light of lightList) {
				(light as Light).shadowTextureSize = (event as CustomEvent<OptionsManagerEvent>).detail.value as number;
			}
		});

		OptionsManagerEvents.addEventListener('*', (event: Event) => {
			if ((event as CustomEvent<OptionsManagerEvent>).detail.name.startsWith('app.css.variables.')) {
				document.documentElement.style.setProperty('--' + (event as CustomEvent<OptionsManagerEvent>).detail.name.split('app.css.variables.')[1], (event as CustomEvent<OptionsManagerEvent>).detail.value as string);
			}
		});

		OptionsManagerEvents.addEventListener('app.lights.customlights', (event: Event) => {
			(async (): Promise<void> => {
				loadoutScene.removeChild(customLightsContainer);
				setCustomLightsContainer(await JSONLoader.fromJSON(JSON.parse((event as CustomEvent<OptionsManagerEvent>).detail.value as string)) as Entity);
				loadoutScene.addChild(customLightsContainer);
				customLightsContainer.setVisible(OptionsManager.getItem('app.lights.usecustomlights'));
			})()
		});


		OptionsManagerEvents.addEventListener('app.sceneexplorer.misc.serialized', (event: Event) => {
			(async (): Promise<void> => {
				loadoutScene.removeChild(this.#serializedEntity);
				this.#serializedEntity = await JSONLoader.fromJSON(JSON.parse((event as CustomEvent<OptionsManagerEvent>).detail.value as string)) as Entity;
				loadoutScene.addChild(this.#serializedEntity);
			})()
		});

		OptionsManagerEvents.addEventListener('app.sceneexplorer.skeleton.jointradius', (event: Event) => getSceneExplorer().setJointsRadius((event as CustomEvent<OptionsManagerEvent>).detail.value as number));

		OptionsManagerEvents.addEventListener('app.lights.usecustomlights', (event: Event) => {
			if (customLightsContainer) {
				customLightsContainer.setVisible((event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);
			}
			if ((event as CustomEvent<OptionsManagerEvent>).detail.value) {
				lightsContainer?.setVisible(false);
				this.#mapLightsContainer?.setVisible(false);
			} else {
				lightsContainer?.setVisible(undefined);
			}
		});
		/*
		OptionsManagerEvents.addEventListener('app.postprocessing.enabled', (event: Event) => this.#composer && (this.#composer.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value));
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.enabled', (event: Event) => this.#pixelatePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.horizontaltiles', (event: Event) => this.#pixelatePass.horizontalTiles = (event as CustomEvent<OptionsManagerEvent>).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.pixelate.pixelstyle', (event: Event) => this.#pixelatePass.pixelStyle = (event as CustomEvent<OptionsManagerEvent>).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.saturate.enabled', (event: Event) => this.#saturatePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.saturate.saturation', (event: Event) => this.#saturatePass.saturation = (event as CustomEvent<OptionsManagerEvent>).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.crosshatch.enabled', (event: Event) => this.#crosshatchPass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.palette.enabled', (event: Event) => this.#palettePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.grain.enabled', (event: Event) => this.#grainPass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value);
		OptionsManagerEvents.addEventListener('app.postprocessing.grain.intensity', (event: Event) => this.#grainPass.intensity = (event as CustomEvent<OptionsManagerEvent>).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.sketch.enabled', (event: Event) => this.#sketchPass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value);

		OptionsManagerEvents.addEventListener('app.postprocessing.oldmovie.enabled', (event: Event) => this.#oldMoviePass.enabled = (event as CustomEvent<OptionsManagerEvent>).detail.value);

		*/
		OptionsManagerEvents.addEventListener('engine.particles.speed', (event: Event) => Source1ParticleSystem.setSpeed((event as CustomEvent<OptionsManagerEvent>).detail.value as number));
		OptionsManagerEvents.addEventListener('engine.particles.simulationsteps', (event: Event) => Source1ParticleSystem.setSimulationSteps((event as CustomEvent<OptionsManagerEvent>).detail.value as number));
		OptionsManagerEvents.addEventListener('engine.particles.simulationrate', () => this.#setParticlesRate());
		OptionsManagerEvents.addEventListener('engine.particles.usefixedrate', () => this.#setParticlesRate());

		OptionsManagerEvents.addEventListener('app.ui.class.menuorder', (event: Event) => this.#setClassOrder((event as CustomEvent<OptionsManagerEvent>).detail.value as boolean));

		OptionsManagerEvents.addEventListener('app.characters.scout.bluepants', (event: Event) => this.#setScoutBluePants((event as CustomEvent<OptionsManagerEvent>).detail.value as boolean));

		OptionsManagerEvents.addEventListener('app.warpainteditor.filter.node', (event: Event) => WarpaintEditor.getGui().setNodeFilter((event as CustomEvent<OptionsManagerEvent>).detail.value as string));

		OptionsManagerEvents.addEventListener('app.usespeechrecognition', (event: Event) => {
			if ((event as CustomEvent<OptionsManagerEvent>).detail.value) {
				this.#speech.start();
			} else {
				this.#speech.stop();
			}
		});

		OptionsManagerEvents.addEventListener('app.engine.source1.newanimationsystem', (event: Event) => {
			Source1ModelInstance.useNewAnimSystem = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean;
		});

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

	async #initShortcuts(): Promise<void> {
		ShortcutHandler.setShortcuts('loadout,3dview,scene-explorer', await OptionsManager.getOptionsPerType('shortcut'));
		ShortcutHandler.addEventListener('app.shortcuts.currentcamera.reset', () => this.#resetCamera());
		ShortcutHandler.addEventListener('app.shortcuts.itemlist.open', () => Controller.dispatchEvent<Panel>(ControllerEvent.ShowPanel, { detail: Panel.Items }));
		ShortcutHandler.addEventListener('app.shortcuts.picture', () => Controller.dispatchEvent(ControllerEvent.SavePicture));
		//ShortcutHandler.addEventListener('app.shortcuts.warpaints.openeditor', () => this.#toggleWarpaintEditor());
	}

	#resetCamera(): void {
		OptionsManager.resetItem('app.cameras.orbit.position');
		OptionsManager.resetItem('app.cameras.orbit.quaternion');
		OptionsManager.resetItem('app.cameras.orbit.target');
		loadoutScene.addChild(orbitCamera);
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
				//Graphics.render(loadoutScene, loadoutScene.activeCamera ?? this.#activeCamera, (event as CustomEvent).detail.delta, {});
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
				//lightsContainer.lookAt(this.#orbitCamera.position);
				vec3.normalize(v, v);
				quat.rotationTo(lightsContainer._quaternion, [0, -1, 0], v);
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
		const order: Record<string, number> = { scout: 0, sniper: 7, soldier: 1, demoman: 3, medic: 6, heavy: 4, pyro: 2, spy: 8, engineer: 5, dummy: 10, warpaints: 11 };
		let variables = '';
		if (menuOrder) {
			for (const npc in order) {
				variables += `--tf2-class-order-${npc}: ${String(order[npc])};`;
			}
		}
		this.#menuOrderStyleSheet.replaceSync(`html{${variables}}`);
	}

	#setBackgroundColor(hex: string): void {
		if (hex) {
			const rgba = hexToRgba(this.#backgroundColor, hex);
			loadoutColorBackground.setColor(rgba);
			/*
			if (hex.toLowerCase() != this.#htmlColorPicker?.getColor().getHex()/*.substring(0, 7)* /) {
				this.#htmlColorPicker?.setHex(hex.toLowerCase());
			}
			*/
		}
	}

	#setBackGroundColorRed(hex: string): void {
		if (hex) {
			this.#backgroundColorRed = hexToRgba(vec4.create(), hex);
		} else {
			this.#backgroundColorRed = undefined;
		}
		this.#setTeamBackground();
	}

	#setBackGroundColorBlu(hex: string): void {
		if (hex) {
			this.#backgroundColorBlu = hexToRgba(vec4.create(), hex);
		} else {
			this.#backgroundColorBlu = undefined;
		}
		this.#setTeamBackground();
	}

	setTeam(team: Team): void {
		// TODO
		//TextureCombiner.setTeam(team);
		//CharacterManager.setSkin(team);
		CharacterManager.setTeam(team);
		this.#setTeamBackground();
	}

	#setTeamBackground(): void {
		if (CharacterManager.getTeam() == Team.Red) {
			loadoutColorBackground.setColor(this.#backgroundColorRed ?? this.#backgroundColor);
		} else {
			loadoutColorBackground.setColor(this.#backgroundColorBlu ?? this.#backgroundColor);
		}
	}

	#setLang(lang: string): void {
		//ItemManager.lang = lang;

		this.#getLanguage(lang).then(json => {
			I18n.setOptions({ translations: [json as I18nTranslation] });
			I18n.setLang(lang);
		});
	}

	async #getLanguage(lang: string): Promise<JSONObject> {
		const translation = this.#translations.get(lang);
		if (translation) {
			return translation;
		}

		const p = new Promise<JSONObject>(resolve => {
			void (async (): Promise<void> => {
				const response = await fetch(`/json/i18n/${lang}.json`);

				const json = await response.json();
				resolve(json);
			})();
		});
		this.#translations.set(lang, await p as I18nTranslation);
		return p;
	}

	#setVerticalFov(fov: number): void {
		orbitCamera.verticalFov = fov;
	}

	#setPerspectiveCameraPosition(position: string): void {
		orbitCamera.setPosition(stringToVec3(position));
	}

	#setPerspectiveCameraQuaternion(quaternion: string): void {
		orbitCamera.setQuaternion(stringToQuat(quaternion));
	}

	#setPerspectiveCameraTarget(target: string): void {
		orbitCameraControl.target.setPosition(stringToVec3(target));
	}

	async #showCompetitiveStage(show: boolean): Promise<void> {
		if (show) {
			const prop = this.#competitiveStage || await addTF2Model(TF2_COMPETITIVE_STAGE);
			if (!prop) {
				return;
			}
			prop.name = 'Competitive stage';
			prop.setPosition([0, -20, -36]);
			prop.setQuaternion([0, 0, -1, 1]);
			this.#competitiveStage = prop;
			prop.setVisible(true);
		} else {
			const prop = this.#competitiveStage;
			if (prop) {
				prop.setVisible(false);
			}
		}
	}

	#setSilhouetteMode(silhouetteMode: boolean): void {
		if (silhouetteMode) {
			Graphics.setIncludeCode('silhouetteMode', '#define SILHOUETTE_MODE');
		} else {
			Graphics.setIncludeCode('silhouetteMode', '#undef SILHOUETTE_MODE');
		}
	}

	#setSilhouetteColor(silhouetteColor: string): void {
		const rgb = hexToRgba(vec4.create(), silhouetteColor);
		Graphics.setIncludeCode('silhouetteColor', `#define SILHOUETTE_COLOR vec4(${rgb[0]},${rgb[1]},${rgb[2]},${rgb[3]})`);
	}

	#showHighLights(show: boolean): void {
		show = show && OptionsManager.getItem('app.characters.highlightselected');
		if (show) {
			Graphics.setIncludeCode('showHighLights', '#define RENDER_HIGHLIGHT');
		} else {
			Graphics.setIncludeCode('showHighLights', '#undef RENDER_HIGHLIGHT');
		}
	}

	async #initDefaultCharacter(): Promise<void> {
		await Graphics.ready;
		CharacterManager.selectCharacter(Tf2Class.None);
	}

	async #initWarpaints(): Promise<void> {
		if (this.#initPaintKitsPromise) {
			return this.#initPaintKitsPromise;
		}
		this.#initPaintKitsPromise = WeaponManager.initPaintKitDefinitions(TF2_WARPAINT_ENGLISH_URL);

		WeaponManager.initView();
		//new WarpaintEditor().init(this.#htmlViewBottom);
		//TextureCombiner.setTeam(CharacterManager.getTeam());

		await this.#initPaintKitsPromise;

		Controller.dispatchEvent<void>(ControllerEvent.WarpaintsLoaded);
	}

	#setPolarRotation(polarRotation: boolean): void {
		if (polarRotation) {
			orbitCameraControl.minPolarAngle = -Infinity;
			orbitCameraControl.maxPolarAngle = Infinity;
		} else {
			orbitCameraControl.minPolarAngle = HALF_PI;
			orbitCameraControl.maxPolarAngle = HALF_PI;

		}
		orbitCameraControl.update();
	}

	#setScoutBluePants(blue: boolean): void {
		if (blue) {
			this.#fetchRedirect.set(SCOUT_BLUE_PANTS_ORIGIN, SCOUT_BLUE_PANTS_DEST);
		}
	}

	#setParticlesRate(): void {
		const fixedRate = OptionsManager.getItem('engine.particles.usefixedrate');
		switch (fixedRate) {
			case 'no':
				Source1ParticleControler.fixedTime = undefined;
				break;
			case 'yes':
				Source1ParticleControler.fixedTime = 1 / Number(OptionsManager.getItem('engine.particles.simulationrate'));
				break;
		}
	}

	#showAboutLayer(): void {
		const html = `${I18n.getString('#loadout_tf_service_provided')}<a href="http://steamcommunity.com/id/baldurstod/" target="_blank">Baldurs Tod</a><br>
		<a href="https://www.redbubble.com/people/Loadout/shop?asc=u" target="_blank">${I18n.getString('#redbubble_shop')}</a><br>
		${I18n.getString('#model_texture_files_property')}<a href="http://www.valvesoftware.com/" target="_blank">Valve Corporation</a><br>
		${I18n.getString('#valve_tf_trademarks')}`;

		addNotification(html, NotificationType.Info, 15);
	}

	#showBugNotification(): void {
		//let html = '<a href="' + TF2_GROUP_URL + '" target="_blank" class="i18n" data-i18n="#get_assistance_on_steam"></a><br><a href="https://discord.gg/7EhW2WCWyQ" target="_blank" class="i18n" data-i18n="#get_assistance_on_discord"></a>';
		const html = createElement('div', {
			childs: [
				createElement('a', {
					style: 'color:white;display:block;',
					href: TF2_GROUP_URL,
					target: '_blank',
					i18n: '#get_assistance_on_steam',
				}),
				createElement('a', {
					style: 'color:white;display:block;',
					href: 'https://discord.gg/7EhW2WCWyQ',//TODO: const
					target: '_blank',
					i18n: '#get_assistance_on_discord',
				}),
			]
		});
		addNotification(html, NotificationType.Info, 15);
	}

	#handlePatreonClick(): void {
		if (PATREON_IS_LOGGED) {
			location.assign('/patreon/logout');
		} else {
			location.assign('/patreon/login');
		}
	}

	async #exportToFBX() {
		if (ENABLE_PATREON_POWERUSER) {
			let binaryFBX = await exportToBinaryFBX(loadoutScene);
			saveFile(new File([binaryFBX as ArrayBuffer], 'loadout.tf.fbx'));
		} else {
			addNotification(I18n.getString('#feature_patreon'), NotificationType.Warning, 10);
		}
	}

	async #export3D(showPopover: boolean) {
		if (ENABLE_PATREON_POWERUSER) {
			if (showPopover && OptionsManager.getItem('app.objexporter.askoptions')) {
				this.#appView.open3DPopover();
			} else {
				this.#export3D2();
			}
		} else {
			addNotification(I18n.getString('#feature_patreon'), NotificationType.Warning, 10);
		}
	}

	async #export3D2() {
		let subdivisions = 0;
		if (OptionsManager.getItem('app.objexporter.subdivide')) {
			subdivisions = OptionsManager.getItem('app.objexporter.subdivide.iterations');
		}
		let files = await new ObjExporter().exportMeshes({
			meshes: loadoutScene.getMeshList(),
			exportTexture: OptionsManager.getItem('app.objexporter.exporttextures'),
			singleMesh: OptionsManager.getItem('app.objexporter.singlemesh'),
			digits: 4,
			subdivisions: subdivisions,
			mergeTolerance: 0.001,
		});

		for (let file of files) {
			saveFile(file);
			await setTimeoutPromise(200);
		}
	}

}
new Application();

function hexToRgba(out: vec4, hex: string): vec4 {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	if (result && result.length > 4) {
		vec4.set(out,
			parseInt(result[1]!, 16) / 255.0,
			parseInt(result[2]!, 16) / 255.0,
			parseInt(result[3]!, 16) / 255.0,
			parseInt(result[4]!, 16) / 255.0,
		);
	}
	return out
}
