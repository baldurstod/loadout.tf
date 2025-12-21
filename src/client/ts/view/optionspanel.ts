import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { AudioMixer, Entity, Line, Repository, RepositoryEntry, SceneExplorer, ShaderEditor, Sphere } from 'harmony-3d';
import { defineRepository, HTMLRepositoryElement } from 'harmony-3d-utils';
import { OptionsManager, OptionsManagerEvent, OptionsManagerEvents } from 'harmony-browser-utils';
import { createElement, defineHarmonyColorPicker, defineHarmonyFileInput, defineHarmonyTab, defineHarmonyTabGroup, display, HarmonySwitchChange, hide, HTMLHarmonyColorPickerElement, HTMLHarmonyFileInputElement, HTMLHarmonyRadioElement, HTMLHarmonySwitchElement, HTMLHarmonyTabElement, HTMLHarmonyTabGroupElement, I18n } from 'harmony-ui';
import { fileToImage } from 'harmony-utils';
import optionsCSS from '../../css/options.css';
import repositoryEntryCSS from '../../css/repositoryentry.css';
import { ENABLE_PATREON_POWERUSER, TESTING } from '../bundleoptions';
import { Controller, ControllerEvent, SetBackgroundType, ShowBadge } from '../controller';
import { BackgroundType, CameraType, Panel } from '../enums';
import { CharacterManager, CustomDisposition } from '../loadout/characters/charactermanager';
import { addTF2Model, loadoutScene } from '../loadout/scene';
import { getShaderToyList } from '../utils/shadertoy';
import { DynamicPanel } from './dynamicpanel';
import { ScriptEditor } from './scripteditor';

export class OptionsPanel extends DynamicPanel {
	#htmlTabGroup?: HTMLHarmonyTabGroupElement;
	//#htmlTabImport?: HTMLHarmonyTabElement;
	#htmlLanguageSelector?: HTMLSelectElement;
	#htmlColorPicker?: HTMLHarmonyColorPickerElement;
	#htmlCSSTheme?: HTMLHarmonyRadioElement;
	#htmlMuteSounds!: HTMLHarmonySwitchElement;
	#htmlSolidColor?: HTMLElement;
	#htmlShaderToy?: HTMLElement;
	#htmlShaderToyList?: HTMLSelectElement;
	#htmlPictureBackground?: HTMLElement;
	#htmlBadgeLevel!: HTMLSelectElement;
	#htmlBadgeTier!: HTMLSelectElement;
	#htmlSceneExplorerTab?: HTMLHarmonyTabElement;
	#htmlVerticalFovSlider?: HTMLInputElement;
	#htmlVerticalFovValue?: HTMLLabelElement;
	#htmlOverrideGameModels?: HTMLHarmonySwitchElement;
	#htmlCharacterDisposition?: HTMLElement;
	#shaderEditor = new ShaderEditor();
	#scriptEditor = new ScriptEditor();
	#customDisposition: CustomDisposition = { countX: 1, countY: 1, countZ: 1 };

	constructor() {
		super(Panel.Options, [optionsCSS]);
		hide(this.getShadowRoot());
		this.#initListeners();
	}

	protected override initHTML(): void {
		defineHarmonyTab();
		defineHarmonyTabGroup();
		defineHarmonyFileInput();
		defineHarmonyColorPicker();

		this.#htmlTabGroup = createElement('harmony-tab-group', {
			parent: this.getShadowRoot(),
			class: 'loadout-application-options',
			adoptStyles: [optionsCSS],
		}) as HTMLHarmonyTabGroupElement;


		this.#initHTMLGeneralOptions();
		this.#initHtmlCameraOptions();
		this.#initHtmlGraphicOptions();
		this.#initHtmlMeetTheTeamOptions();
		this.#initHtmlSceneExplorer();
		this.#initHtmlShaderEditor();
		if (ENABLE_PATREON_POWERUSER) {
			this.#initHtmlScripEditor();
		}
		this.#initHtmlImportFiles();
		this.#initLanguages();
	}

	#initHTMLGeneralOptions(): void {
		const htmlGeneralOptionsTab = createElement('harmony-tab', {
			parent: this.#htmlTabGroup,
			'data-i18n': '#general_options'
		});

		/**************** misc options ****************/
		const htmlMiscOptions = createElement('group', {
			class: 'misc',
			i18n: {
				title: '#general',
			},
			parent: htmlGeneralOptionsTab,

		});

		const htmlLanguage = createElement('div', {
			parent: htmlMiscOptions,
		});
		const htmlLanguageLabel = createElement('label', { class: 'space-after', i18n: '#language' });
		this.#htmlLanguageSelector = createElement('select', {
			class: 'language-selector',
			$input: () => OptionsManager.setItem('app.lang', this.#htmlLanguageSelector!.value),
		}) as HTMLSelectElement;
		OptionsManagerEvents.addEventListener('app.lang', (event: Event) => this.#htmlLanguageSelector!.value = (event as CustomEvent<OptionsManagerEvent>).detail.value as string);

		const languageAuthors = createElement('div', { class: 'option-language-authors' });
		/*I18n.addEventListener('translationsloaded', () => {
			languageAuthors.innerText = '';
			let authors = I18n.authors;
			for (let author of authors) {
				languageAuthors.innerText += '<a target="_blank" href="http://steamcommunity.com/profiles/' + author + '"><div class="option-steam-profile-button"></div></a>';
			}
		});*/
		htmlLanguage.append(htmlLanguageLabel, this.#htmlLanguageSelector, languageAuthors);
		this.#htmlColorPicker = createElement('harmony-color-picker', {
			$change: (event: CustomEvent) => OptionsManager.setItem('app.backgroundcolor', (event).detail.hex.toUpperCase()),
		}) as HTMLHarmonyColorPickerElement;

		this.#htmlCSSTheme = createElement('harmony-radio', {
			parent: htmlMiscOptions,
			childs: [
				createElement('button', { 'i18n': '#light_theme', value: 'light' }),
				createElement('button', { 'i18n': '#browser_theme', value: '' }),
				createElement('button', { 'i18n': '#dark_theme', value: 'dark' }),
			],
			$change: (event: CustomEvent) => {
				if (event.detail.state) {
					OptionsManager.setItem('app.css.theme', (event).detail.value);
				}
			},
		}) as HTMLHarmonyRadioElement;

		createElement('harmony-switch', {
			parent: htmlMiscOptions,
			'data-i18n': '#use_bots',
			$change: (event: CustomEvent<HarmonySwitchChange>) => Controller.dispatchEvent<boolean>(ControllerEvent.UseBots, { detail: event.detail.state }),
		});

		createElement('harmony-switch', {
			parent: htmlMiscOptions,
			'data-i18n': '#show_competitive_stage',
			$change: (event: CustomEvent<HarmonySwitchChange>) => Controller.dispatchEvent<boolean>(ControllerEvent.ShowCompetitiveStage, { detail: event.detail.state }),
		});

		this.#htmlMuteSounds = createElement('harmony-switch', {
			'data-i18n': '#mute_sounds',
			$change: () => OptionsManager.setItem('app.audio.mute.master', this.#htmlMuteSounds.state),
		}) as HTMLHarmonySwitchElement;
		OptionsManagerEvents.addEventListener('app.audio.mute.master', (event: Event) => this.#htmlMuteSounds.state = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		const htmlSpeech: HTMLHarmonySwitchElement = createElement('harmony-switch', {
			'data-i18n': '#speech_recognition',
			$change: () => OptionsManager.setItem('app.usespeechrecognition', htmlSpeech.state),
		}) as HTMLHarmonySwitchElement;
		OptionsManagerEvents.addEventListener('app.usespeechrecognition', (event: Event) => htmlSpeech.state = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		createElement('div', {
			childs: [
				htmlSpeech,
				createElement('a', {
					href: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3381409537',
					i18n: '#command_list',
					class: 'command-list',
					target: '_blank',
				})
			]
		})

		createElement('div', {
			class: 'option-line',
			childs: [
				createElement('label', { i18n: '#effects_speed' }),
				createElement('input', {
					type: 'range',
					min: 0.01,
					max: 1,
					step: 0.01,
					$input: (event: Event) => OptionsManager.setItem('engine.particles.speed', (event.target as HTMLInputElement).value),
				}),
			],
		});

		const htmlMap = createElement('div');
		const htmlMapLabel = createElement('label', { class: 'space-after', i18n: '#map' });
		const htmlMapInput: HTMLInputElement = createElement('input', {
			list: 'loadout-application-map-list',
			$change: (event: InputEvent) => {
				(event.target as HTMLInputElement).blur();
				//this.#mapStartup((event.target as HTMLInputElement).value);
				Controller.dispatchEvent<string>(ControllerEvent.ChangeMap, { detail: (event.target as HTMLInputElement).value });
			},
			$focus: () => Controller.dispatchEvent<void>(ControllerEvent.InitMapList),
			$keydown: (event: MouseEvent) => event.stopPropagation(),
		}) as HTMLInputElement;
		const htmlMapList: HTMLDataListElement = createElement('datalist', { id: 'loadout-application-map-list' }) as HTMLDataListElement;
		htmlMap.append(htmlMapLabel, htmlMapInput, htmlMapList);

		//htmlMiscOptions.append(htmlShowCompetitiveStage, this.#htmlMuteSounds, htmlSpeechContainer, htmlEffectSpeed, htmlMap);
		/**************** misc options ****************/

		/**************** Videos options ****************/
		const htmlVideoOptions = createElement('group', { i18n: { title: '#video' }, 'class': 'loadout-application-options-video' });
		htmlGeneralOptionsTab.append(htmlVideoOptions);

		createElement('harmony-switch', {
			parent: htmlVideoOptions,
			'data-i18n': '#record_video',
			$change: (event: CustomEvent<HarmonySwitchChange>) => Controller.dispatchEvent<boolean>(ControllerEvent.ToggleVideo, { detail: event.detail.state }),
		}) as HTMLHarmonySwitchElement;

		const htmlRecordVideoSize = createElement('div');
		const htmlRecordVideoSizeLabel = createElement('label', { class: 'space-after', i18n: '#picture_size' });
		const htmlRecordVideoSizeInput = createElement('input', {
			list: 'loadout-application-options-size-list',
			$input: (event: InputEvent) => OptionsManager.setItem('app.picture.size', (event.target as HTMLInputElement).value),
			$keydown: (event: MouseEvent) => event.stopPropagation(),
		});
		const htmlRecordVideoSizeList = createElement('datalist', { id: 'loadout-application-options-size-list' });
		const list = ['', '128*128', '184*184', '1600*900', '1920*1080', '2560*1440', '3840*2160'];
		list.forEach((value) => {
			const option = createElement('option', { 'data-value': value, innerText: value });
			htmlRecordVideoSizeList.append(option);
		});
		//htmlRecordVideoSizeList.innerHTML = '<datalist><option data-value=""></option><option data-value="128*128">128*128</option><option data-value="184*184">184*184</option><option data-value="1600*900">1600*900</option><option data-value="1920*1080">1920*1080</option><option data-value="2560*1440">2560*1440</option><option data-value="3840*2160">3840*2160</option></datalist>';
		htmlRecordVideoSize.append(htmlRecordVideoSizeLabel, htmlRecordVideoSizeInput, htmlRecordVideoSizeList);
		htmlVideoOptions.append(htmlRecordVideoSize);


		/**************** Videos options ****************/



		/**************** Background options ****************/
		const htmlBackgroundOptions = createElement('group', { i18n: { title: '#background' }, class: 'loadout-application-options-background' });
		htmlGeneralOptionsTab.append(htmlBackgroundOptions);
		const htmlBackgroundType = createElement('div');
		const htmlBackgroundTypeLabel = createElement('label', { class: 'space-after', i18n: '#background_type' });

		const htmlBackgroundSelect = createElement('select', {
			$change: (event: Event) => {
				const type = (event.target as HTMLSelectElement).value as BackgroundType;
				let param: string | FileList | null = null;

				display(this.#htmlShaderToy, type == BackgroundType.ShaderToy);
				display(this.#htmlSolidColor, type == BackgroundType.SolidColor);
				display(this.#htmlPictureBackground, type == BackgroundType.Picture);

				if (type == BackgroundType.ShaderToy) {
					param = this.#htmlShaderToyList!.value;

					getShaderToyList().then(shaders => {
						if (!shaders) {
							return;
						}
						for (let name of shaders) {
							let option = createElement('option', { innerHTML: name, value: name }) as HTMLOptionElement;
							this.#htmlShaderToyList?.append(option);
						}
					});
				}

				Controller.dispatchEvent<SetBackgroundType>(ControllerEvent.SetBackgroundType, { detail: { type, param } })
			},
		});
		//htmlBackgroundSelect.addEventListener('change', (event) => this.#setBackgroundType(event.target.value));
		const backgroundOptions = new Map<BackgroundType, string>([[BackgroundType.None, '#none'], [BackgroundType.SolidColor, '#solidcolor'], [BackgroundType.ShaderToy, '#shadertoy'], [BackgroundType.Picture, '#picture']]);
		for (const [key, label] of backgroundOptions) {
			const option = createElement('option', { i18n: label, value: key });
			if (key == BackgroundType.SolidColor) {
				option.setAttribute('selected', "");
			}
			htmlBackgroundSelect.append(option);
		}
		htmlBackgroundType.append(htmlBackgroundTypeLabel, htmlBackgroundSelect);

		// Solid color options
		this.#htmlSolidColor = createElement('div');
		this.#htmlSolidColor.append(this.#htmlColorPicker);

		this.#htmlShaderToy = createElement('div', {
			hidden: true,
			childs: [
				createElement('label', { class: 'space-after', i18n: '#shadertoy' }),
				this.#htmlShaderToyList = createElement('select', {
					$change: (event: Event) => Controller.dispatchEvent<SetBackgroundType>(ControllerEvent.SetBackgroundType, { detail: { type: BackgroundType.ShaderToy, param: (event.target as HTMLSelectElement).value } }),
				}) as HTMLSelectElement,
				//this.#htmlShaderToyLink = createElement('a', { target: '_blank' }) as HTMLLinkElement,
			],
		});


		this.#htmlPictureBackground = createElement('div', {
			hidden: true,
			childs: [
				createElement('label', { class: 'space-after', i18n: '#picture' }),
				createElement('input', {
					type: 'file',
					accept: 'image/*',
					$change: (event: Event) => Controller.dispatchEvent<SetBackgroundType>(ControllerEvent.SetBackgroundType, { detail: { type: BackgroundType.Picture, param: (event.target as HTMLInputElement).files } }),
				}),
			],
		});

		htmlBackgroundOptions.append(htmlBackgroundType, this.#htmlSolidColor, this.#htmlShaderToy, this.#htmlPictureBackground);
		/**************** Background options ****************/

		/**************** Export ****************/
		if (TESTING) {
			const htmlExportScene = createElement('div', { class: 'option-button', i18n: '#export_scene' });
			htmlExportScene.addEventListener('click', () => console.error(JSON.stringify(loadoutScene.toJSON())));

			htmlGeneralOptionsTab.append(htmlExportScene);
		}
		/**************** Export ****************/

		/**************** Casual badge ****************/
		createElement('group', {
			i18n: {
				title: '#background',
			},
			parent: htmlGeneralOptionsTab,
			class: 'loadout-application-options-background',
			childs: [
				createElement('label', {
					childs: [
						createElement('span', {
							i18n: '#badge_level',
						}),
						this.#htmlBadgeLevel = createElement('select', {
							$change: () => Controller.dispatchEvent<ShowBadge>(ControllerEvent.ShowBadge, { detail: { tier: Number(this.#htmlBadgeTier.value), level: Number(this.#htmlBadgeLevel.value) } }),
						}) as HTMLSelectElement,
					],
				}),
				createElement('label', {
					childs: [
						createElement('span', {
							i18n: '#badge_tier',
						}),
						this.#htmlBadgeTier = createElement('select', {
							$change: () => Controller.dispatchEvent<ShowBadge>(ControllerEvent.ShowBadge, { detail: { tier: Number(this.#htmlBadgeTier.value), level: Number(this.#htmlBadgeLevel.value) } }),
						}) as HTMLSelectElement,
					],
				}),
			]
		});

		for (let i = 0; i < 151; ++i) {
			const v = i == 0 ? '' : i;
			createElement('option', { innerHTML: String(v), value: String(v), parent: this.#htmlBadgeLevel })
		}
		for (let i = 1; i < 9; ++i) {
			createElement('option', { innerHTML: String(i), value: String(i), parent: this.#htmlBadgeTier })
		}
		/**************** Casual badge ****************/
	}

	#initHtmlCameraOptions(): void {
		const htmlCameraOptionsTab = createElement('harmony-tab', {
			parent: this.#htmlTabGroup,
			'data-i18n': '#camera_options'
		});

		const cameraTypeRadioGroup = createElement('harmony-radio') as HTMLHarmonyRadioElement;
		const cameraTypeOrbit = createElement('button', { i18n: '#camera_type_orbit', value: CameraType.Orbit });
		const cameraTypeFreefly = createElement('button', { i18n: '#camera_type_freefly', value: CameraType.FreeFly });
		const cameraTypeFps = createElement('button', { i18n: '#camera_type_fps', value: CameraType.FirstPerson });

		cameraTypeRadioGroup.addEventListener('change', (event: Event) => {
			if ((event as CustomEvent).detail.state) {
				Controller.dispatchEvent<CameraType>(ControllerEvent.SelectCamera, { detail: (event as CustomEvent).detail.value as CameraType });
			}
		});
		/*
				cameraTypeOrbit.addEventListener('activated', () => {this.camera = this.#orbitCamera;this.#setActiveCameraControl(this.#orbitCameraControl)});
				cameraTypeFreefly.addEventListener('activated', () => {this.camera = this.#orbitCamera;this.#setActiveCameraControl(this.#firstPersonCameraControl);});
				cameraTypeFps.addEventListener('activated', () => {this.camera = this.#firstPersonCamera;this.#setActiveCameraControl()});
		*/


		cameraTypeRadioGroup.append(cameraTypeOrbit);
		cameraTypeRadioGroup.append(cameraTypeFreefly);
		cameraTypeRadioGroup.append(cameraTypeFps);
		const line = createElement('div', { class: 'option-line' });
		line.append(cameraTypeRadioGroup);
		htmlCameraOptionsTab.append(line);

		let htmlOrtho: HTMLHarmonySwitchElement;
		createElement('div', {
			class: 'option-line',
			parent: htmlCameraOptionsTab,
			childs: [
				htmlOrtho = createElement('harmony-switch', {
					'data-i18n': '#orthorgraphic_view',
					$change: () => OptionsManager.setItem('app.cameras.orbit.orthographic', htmlOrtho.state),
				}) as HTMLHarmonySwitchElement,
			],
		});
		OptionsManagerEvents.addEventListener('app.cameras.orbit.orthographic', (event: Event) => htmlOrtho.state = (event as CustomEvent).detail.value);

		createElement('div', {
			class: 'option-line',
			parent: htmlCameraOptionsTab,
			childs: [
				createElement('label', { i18n: '#vertical_fov' }),
				this.#htmlVerticalFovSlider = createElement('input', {
					type: 'range',
					min: 10,
					max: 120,
					$input: (event: InputEvent) => OptionsManager.setItem('app.cameras.orbit.verticalfov', (event.target as HTMLInputElement).value),
				}) as HTMLInputElement,
				this.#htmlVerticalFovValue = createElement('label') as HTMLLabelElement,
			],
		});

		let htmlFreeRotation: HTMLHarmonySwitchElement;
		createElement('div', {
			class: 'option-line',
			parent: htmlCameraOptionsTab,
			childs: [
				htmlFreeRotation = createElement('harmony-switch', {
					'data-i18n': '#free_rotation',
					$change: (event: CustomEvent) => OptionsManager.setItem('app.cameras.orbit.polarrotation', (event.target as HTMLHarmonySwitchElement).state),
				}) as HTMLHarmonySwitchElement,
			],
		});
		OptionsManagerEvents.addEventListener('app.cameras.orbit.polarrotation', (event: Event) => htmlFreeRotation.state = (event as CustomEvent).detail.value);

		let htmlReplicate: HTMLHarmonySwitchElement;
		createElement('div', {
			class: 'option-line',
			parent: htmlCameraOptionsTab,
			childs: [
				htmlReplicate = createElement('harmony-switch', {
					'data-i18n': '#replicate_camera',
					$change: (event: CustomEvent) => OptionsManager.setItem('app.cameras.orbit.replicate', (event.target as HTMLHarmonySwitchElement).state),
				}) as HTMLHarmonySwitchElement,
			],
		});
		OptionsManagerEvents.addEventListener('app.cameras.orbit.replicate', (event: Event) => htmlReplicate.state = (event as CustomEvent).detail.value);

		createElement('div', {
			class: 'option-line',
			parent: htmlCameraOptionsTab,
			childs: [
				createElement('div', {
					class: 'option-button',
					i18n: '#reset_camera',
					$click: () => Controller.dispatchEvent<void>(ControllerEvent.ResetCamera),
				}),
			],
		});
	}

	#initHtmlGraphicOptions(): void {
		const htmlGraphicOptionsTab = createElement('harmony-tab', {
			class: 'loadout-application-options-graphics',
			parent: this.#htmlTabGroup,
			'data-i18n': '#graphic_options',
		});


		const htmlGraphicOptions = createElement('group', { i18n: { title: '#general', }, class: 'graphic-options' });
		const htmlPostProcessingOptions = createElement('group', { i18n: { title: '#post_processing', }, class: 'graphic-options' });
		htmlGraphicOptionsTab.append(htmlGraphicOptions, htmlPostProcessingOptions);

		const addToggleSwitch = (label: string, optionName: string, parent: HTMLElement): void => {
			const sw = createElement('harmony-switch', {
				'data-i18n': label,
				parent: parent,
				$change: () => OptionsManager.setItem(optionName, sw.state),
			}) as HTMLHarmonySwitchElement;
			OptionsManagerEvents.addEventListener(optionName, (event: Event) => { sw.state = (event as CustomEvent).detail.value });
		}

		addToggleSwitch('#highlight_selected_character', 'app.characters.highlightselected', htmlGraphicOptions);
		addToggleSwitch('#silhouette', 'engine.render.silhouettemode', htmlGraphicOptions);
		addToggleSwitch('#use_lighting', 'app.lights.renderlights', htmlGraphicOptions);
		addToggleSwitch('#render_map', 'app.map.rendermap', htmlGraphicOptions);
		addToggleSwitch('#render_particle_effects', 'app.effects.renderparticles', htmlGraphicOptions);
		addToggleSwitch('#scout_blue_pants', 'app.characters.scout.bluepants', htmlGraphicOptions);

		let htmlShadowQuality: HTMLSelectElement;
		createElement('div', {
			parent: htmlGraphicOptions,
			childs: [
				createElement('label', {
					i18n: '#shadow_quality',
				}),
				htmlShadowQuality = createElement('select', {
					$input: () => OptionsManager.setItem('engine.shadows.quality', htmlShadowQuality.value)
				}) as HTMLSelectElement,
			]
		});
		const qualities: Record<string, string> = {
			'256': '#very_low',
			'512': '#low',
			'1024': '#normal',
			'2048': '#high',
			'4096': '#very_high',
			'8192': '#ultra',
		};

		const arr = Object.keys(qualities);
		let qualityName;
		while (qualityName = arr.shift()) {
			const qualityCaption = qualities[qualityName];

			const option = createElement('option', { i18n: qualityCaption, value: qualityName });
			//option.innerHTML = langCaption;
			htmlShadowQuality.appendChild(option);
			/*if (currentlang == qualityName) {
				option.selected = 'selected';
			}*/
		}
		OptionsManagerEvents.addEventListener('engine.shadows.quality', (event: Event) => htmlShadowQuality.value = (event as CustomEvent).detail.value);

		addToggleSwitch('#enable_post_processing', 'app.postprocessing.enabled', htmlPostProcessingOptions);
		addToggleSwitch('#post_processing_grain', 'app.postprocessing.grain.enabled', htmlPostProcessingOptions);
		addToggleSwitch('#post_processing_saturation', 'app.postprocessing.saturate.enabled', htmlPostProcessingOptions);
		addToggleSwitch('#post_processing_crosshatch', 'app.postprocessing.crosshatch.enabled', htmlPostProcessingOptions);
		addToggleSwitch('#post_processing_palette', 'app.postprocessing.palette.enabled', htmlPostProcessingOptions);
		addToggleSwitch('#post_processing_pixelate', 'app.postprocessing.pixelate.enabled', htmlPostProcessingOptions);
		addToggleSwitch('#post_processing_sketch', 'app.postprocessing.sketch.enabled', htmlPostProcessingOptions);
		addToggleSwitch('#post_processing_old_movie', 'app.postprocessing.oldmovie.enabled', htmlPostProcessingOptions);
	}

	#initHtmlMeetTheTeamOptions(): void {
		const poseParameters = new Map<string, string>([
			["move_x", '#move_forward'],
			["move_y", '#move_sideways'],
			["body_yaw", '#look_sideways'],
			["body_pitch", '#look_up'],
			["r_arm", '#right_arm'],
			["r_hand_grip", '#right_hand_grip'],
		])

		function setPoseParameter(name: string, value: number): void {
			const currentCharacter = CharacterManager.getCurrentCharacter();
			if (!currentCharacter) {
				return;
			}

			currentCharacter.setPoseParameter(name, value);
		}

		let showHiddenCharacters: HTMLHarmonySwitchElement;

		createElement('harmony-tab', {
			'data-i18n': '#meet_the_team',
			parent: this.#htmlTabGroup,
			events: {
				//activated: () => CharacterManager.initDispositions(),
			},
			childs: [
				//CharacterManager.htmlCharacterDisposition,
				this.#htmlCharacterDisposition = createElement('div', { class: 'dispositions' }),
				createElement('div', {
					class: 'option-button',
					i18n: '#setup_meet_the_team',
					events: {
						click: () => { CharacterManager.setupMeetTheTeam() },
					}
				}),
				createElement('div', {
					class: 'option-button',
					i18n: '#remove_current_character',
					events: {
						click: () => CharacterManager.removeCharacter(),
					},
				}),
				createElement('div', {
					class: 'pose-parameters',
					elementCreated: (element: Element) => {
						for (const [key, i18n] of poseParameters) {
							//const i18n = poseParameters[poseParameter];
							createElement('label', {
								parent: element,
								childs: [
									createElement('span', {
										i18n: i18n,
									}),
									createElement('input', {
										type: 'range',
										min: 0,
										max: 1,
										step: 'any',
										events: {
											input: (event: InputEvent) => setPoseParameter(key, Number((event.target as HTMLInputElement).value)),
										},
									}),
								],
							});
						}
					},
				}),
				/*
				createElement('div', {
					class: 'option-button',
					i18n: '#compare_warpaints',
					$click: async () => {
						await CharacterManager.selectCharacter(Tf2Class.CompareWarpaints);
					},
				}),
				*/
				showHiddenCharacters = createElement('harmony-switch', {
					'data-i18n': '#show_hidden_characters',
					$change: () => OptionsManager.setItem('app.characters.showhidden', showHiddenCharacters.state),
				}) as HTMLHarmonySwitchElement,
				createElement('harmony-file-input', {
					'data-i18n': '#import_image',
					hidden: !TESTING,
					//'data-accept': '.zip,.vpk',
					'data-tooltip-i18n': '#import_image',
					$change: async (event: Event) => {
						for (const file of (event.target as HTMLHarmonyFileInputElement).files ?? []) {

							const image = await fileToImage(file);

							if (image) {
								const vision = await FilesetResolver.forVisionTasks('assets/mediapipe/tasks-vision/wasm');
								const poseLandmarker = await PoseLandmarker.createFromOptions(
									vision,
									{
										baseOptions: {
											modelAssetPath: 'assets/mediapipe/models/pose_landmarker_full.task',
										},
										runningMode: "IMAGE",
										numPoses: 3,
									}
								);

								const result = poseLandmarker.detect(image);
								console.log(result);

								for (const landmarks of result.landmarks) {
									for (const landmark of landmarks) {
										new Sphere({
											position: [landmark.x * 100, landmark.z * 100, -landmark.y * 100],
											parent: loadoutScene,
										});
									}

									for (const connection of PoseLandmarker.POSE_CONNECTIONS) {
										const startLandmark = landmarks[connection.start];
										const endLandmark = landmarks[connection.end];
										if (startLandmark && endLandmark) {
											new Line({
												//position: [landmark.x * 100, landmark.z * 100, -landmark.y * 100],
												start: [startLandmark.x * 100, startLandmark.z * 100, -startLandmark.y * 100],
												end: [endLandmark.x * 100, endLandmark.z * 100, -endLandmark.y * 100],
												parent: loadoutScene,
											});
										}
									}
								}
							}
						}
					},
				}),
			],
		});
		OptionsManagerEvents.addEventListener('app.characters.showhidden', (event: Event) => showHiddenCharacters.state = (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean);

		this.#initDispositions();
	}

	#initHtmlSceneExplorer(): void {
		this.#htmlSceneExplorerTab = createElement('harmony-tab', {
			'data-i18n': '#scene_explorer',
			parent: this.#htmlTabGroup,
			child: new SceneExplorer().htmlElement,
		}) as HTMLHarmonyTabElement;
	}

	#initHtmlShaderEditor(): void {
		const htmlShaderEditorTab = createElement('harmony-tab', { 'data-i18n': '#shader_editor' });
		this.#htmlTabGroup?.append(htmlShaderEditorTab);

		htmlShaderEditorTab.addEventListener('activated', () => {
			this.#shaderEditor.initEditor({ aceUrl: './assets/js/ace-builds/src-min/ace.js', displayCustomShaderButtons: true });
			htmlShaderEditorTab.append(this.#shaderEditor);
		});
	}

	#initHtmlScripEditor(): void {
		const htmlScriptEditorTab = createElement('harmony-tab', { 'data-i18n': '#script_editor' });
		this.#htmlTabGroup?.append(htmlScriptEditorTab);

		htmlScriptEditorTab.addEventListener('activated', () => {
			this.#scriptEditor.initEditor({ aceUrl: './assets/js/ace-builds/src-min/ace.js' });
			htmlScriptEditorTab.append(this.#scriptEditor);
		});
	}

	#initHtmlImportFiles(): void {
		defineHarmonyFileInput();
		defineRepository();
		const htmlTabImport = createElement('harmony-tab', {
			parent: this.#htmlTabGroup,
			'data-i18n': '#import_files',
			childs: [
				createElement('group', {
					class: 'misc',
					i18n: {
						title: '#import_models_locally',
					},
					childs: [
						createElement('harmony-file-input', {
							'data-i18n': '#import_models_locally',
							'data-accept': '.zip,.vpk',
							'data-tooltip-i18n': '#import_models_zip_tooltip',
							//$change: (event: Event) => this.#importModels((event.target as HTMLHarmonyFileInputElement).files, this.#htmlOverrideGameModels!.state as boolean),
							$change: (event: Event) => Controller.dispatchEvent<File[]>(ControllerEvent.ImportFiles, { detail: [...((event.target as HTMLHarmonyFileInputElement).files ?? [])] }),
						}),
						this.#htmlOverrideGameModels = createElement('harmony-switch', {
							'data-i18n': '#override_game_models',
							$change: () => OptionsManager.setItem('app.repositories.import.overridemodels', this.#htmlOverrideGameModels!.state),
						}) as HTMLHarmonySwitchElement,
					],
				}),
			]
		}) as HTMLHarmonyTabElement;

		OptionsManagerEvents.addEventListener('app.repositories.import.overridemodels', (event: Event) => this.#htmlOverrideGameModels!.state = (event as CustomEvent).detail.value);


		async function addModel(entry: RepositoryEntry, parent?: Entity | null): Promise<void> {
			const model = await addTF2Model(loadoutScene, entry.getFullName(), entry.getRepository().name);

			if (parent && model) {
				parent.addChild(model);
			}
		}

		Controller.addEventListener(ControllerEvent.RepositoryAdded, (event: Event) => {
			const repository = (event as CustomEvent<Repository>).detail;

			const repositoryView = createElement('harmony3d-repository', {
				parent: htmlTabImport,
				adoptStyle: repositoryEntryCSS,
				events: {
					fileclick: (event: CustomEvent) => console.info((event).detail.getFullName()),
					directoryclick: (event: CustomEvent) => console.info((event).detail.getFullName(), event),
					entrycreated: (event: CustomEvent) => {
						createElement('div', {
							class: 'custom-buttons',
							parent: (event).detail.view,
							slot: 'custom',
							childs: [
								createElement('button', {
									i18n: '#add_to_scene',
									events: {
										click: () => { addModel((event).detail.entry) },
									}
								}),
								createElement('button', {
									i18n: '#add_to_current_character',
									events: {
										// eslint-disable-next-line @typescript-eslint/no-misused-promises
										click: async () => addModel((event).detail.entry, await CharacterManager.getCurrentCharacter()?.getModel()),
									}
								}),
							]
						});
						I18n.observeElement((event).detail.view);
					},
				}
			}) as HTMLRepositoryElement;
			repositoryView.setFilter({ extension: 'mdl', directories: false });
			repositoryView.setRepository(repository);

		});
	}


	/*
	async #importModels(files: FileList | null, overrideModels: boolean) {
		if (!files) {
			return;
		}
		for (const file of files) {
			await this.#importModels2(file, overrideModels);
		}
	}

	async #importModels2(file: File, overrideModels: boolean) {
		//TODO: check zip
		const dota2Repository = Repositories.getRepository('dota2') as MergeRepository;
		let localRepo: Repository;

		if (file.name.endsWith('.zip')) {
			localRepo = new ZipRepository(file.name, file);
		} else if (file.name.endsWith('.vpk')) {
			localRepo = new VpkRepository(file.name, [file]);
		} else {
			return;
		}

		if (overrideModels) {
			//TODO:add message
			dota2Repository.unshiftRepository(localRepo);
		} else {
			const repo = new ManifestRepository(new MergeRepository(file.name, localRepo, dota2Repository));
			Repositories.addRepository(repo);
			await repo.generateModelManifest();
			this.#addRepo(repo);
			Source2ModelManager.loadManifest(file.name);
		}
	}

	async #addRepo(repo: Repository) {
		const root = await repo.getFileList();
		if (!root) {
			return;
		}

		defineRepository();

		const repositoryView = createElement('harmony3d-repository', {
			parent: this.#htmlTabImport,
			adoptStyle: repositoryEntryCSS,
			events: {
				fileclick: (event: CustomEvent) => console.info((event as CustomEvent).detail.getFullName()),
				directoryclick: (event: CustomEvent) => console.info((event as CustomEvent).detail.getFullName(), event),
				entrycreated: (event: CustomEvent) => {
					createElement('div', {
						class: 'custom-buttons',
						parent: (event as CustomEvent).detail.view,
						slot: 'custom',
						childs: [
							createElement('button', {
								i18n: '#add_to_scene',
								events: {
									click: () => this.#addModel((event as CustomEvent).detail.entry),
								}
							}),
							/*
							createElement('button', {
								i18n: '#add_to_current_character',
								events: {
									click: () => this.#addModel((event as CustomEvent).detail.entry, CharacterManager.getCurrentCharacter()?.characterModel),
								}
							}),
							* /
						]
					});
					I18n.observeElement((event as CustomEvent).detail.view);
				},
			}
		}) as HTMLRepositoryElement;
		repositoryView.setFilter({ extension: 'vmdl_c', directories: false });
		repositoryView.setRepository(repo);
		//repositoryView.addStyle(repositoryEntryCSS);
	}

	async #addModel(entry: RepositoryEntry, parent?: Entity | null) {
		const model = await Source2ModelManager.createInstance(entry.getRepository().name, entry.getFullName(), true);//await ModelManager.addTF2Model(entry.getFullName(), entry.getRepository().name);

		if (model) {
			(parent ?? loadoutScene).addChild(model);
		}
	}
	*/

	/*
	#toggle() {
		toggle(this.#htmlElement);

		let event;
		if (isVisible(this.#htmlElement!)) {
			event = EVENT_PANEL_OPTIONS_OPENED;
		} else {
			event = EVENT_PANEL_OPTIONS_CLOSED;
		}
		Controller.dispatchEvent(new CustomEvent(event));
	}
	*/
	#initLanguages(): void {
		const currentlang = OptionsManager.getItem('app.lang');
		const langs: Record<string, string> = {
			'english': 'English',
			'german': 'Deutsch',
			'french': 'Français',
			'italian': 'Italiano',
			'korean': '한국어',
			'spanish': 'Español',
			'schinese': '简体中文',
			'tchinese': '繁體中文',
			'russian': 'Русский',
			'thai': 'ไทย',
			'japanese': '日本語',
			'portuguese': 'Português',
			'polish': 'Polski',
			'danish': 'Dansk',
			'dutch': 'Nederlands',
			'finnish': 'Suomi',
			'norwegian': 'Norsk',
			'swedish': 'Svenska',
			'hungarian': 'Magyar',
			'czech': 'čeština',
			'romanian': 'Română',
			'turkish': 'Türkçe',
			'brazilian': 'Português-Brasil',
			'bulgarian': 'български',
			'greek': 'Ελληνικά',
			'ukrainian': 'Українська'
		};

		const arr = Object.keys(langs);
		let langName;
		while (langName = arr.shift()) {
			const langCaption = langs[langName];

			const option = createElement('option', { value: langName, innerText: langCaption }) as HTMLOptionElement;
			this.#htmlLanguageSelector?.appendChild(option);
			if (currentlang == langName) {
				option.selected = true;
			}
		}
	}

	setLang(lang: string): void {
		if (this.#htmlLanguageSelector) {
			this.#htmlLanguageSelector.value = lang;
		}
	}

	#initListeners(): void {
		OptionsManagerEvents.addEventListener('engine.shadereditor.recompiledelay', (event: Event) => this.#shaderEditor.recompileDelay = (event as CustomEvent<OptionsManagerEvent>).detail.value as number);
		OptionsManagerEvents.addEventListener('app.audio.mute.*', (event: Event) => this.#muteSound((event as CustomEvent<OptionsManagerEvent>).detail.name.replace('app.audio.mute.', ''), (event as CustomEvent<OptionsManagerEvent>).detail.value as boolean));
	}

	#muteSound(group: string, mute: boolean): void {
		AudioMixer.muteGroup(group, mute);
		if (group == 'master') {
			this.#htmlMuteSounds.state = mute;
		}
	}

	#initDispositions(): void {
		this.#htmlCharacterDisposition?.replaceChildren();

		let select: HTMLSelectElement;
		createElement('label', {
			parent: this.#htmlCharacterDisposition,
			childs: [
				createElement('span', {
					i18n: '#preset',
				}),
				select = createElement('select', {
					id: 'character-disposition-select',
					$change: (event: Event) => CharacterManager.useDisposition((event.target as HTMLSelectElement).value),
					//$click: (event: Event) => CharacterManager.useDisposition((event.target as HTMLSelectElement).value),
				}) as HTMLSelectElement,
			],

		})
		//this.htmlCharacterDisposition.append(select);

		//for (let i = 0; i < this.#charactersDispositions.length; i++) {
		for (const [position] of CharacterManager.getSlotsPositions()) {
			const option: HTMLOptionElement = createElement('option') as HTMLOptionElement;
			select.append(option);
			option.innerText = position;
			option.value = position;
		}
		//select.addEventListener('change', (event) => { this.#useDisposition(Number((event.target as HTMLSelectElement).value)); });
		//select.addEventListener('click', (event) => { this.#useDisposition(Number((event.target as HTMLSelectElement).value)); });


		createElement('label', {
			parent: this.#htmlCharacterDisposition,
			childs: [
				createElement('span', {
					i18n: '#count_x',
				}),
				createElement('input', {
					attributes: {
						type: 'number',
					},
					value: String(this.#customDisposition.countX),
					$change: (event: InputEvent) => {
						this.#customDisposition.countX = Number((event.target as HTMLInputElement).value);
						CharacterManager.refreshCustomDisposition(this.#customDisposition);
					},
				})
			],
		});
		createElement('label', {
			parent: this.#htmlCharacterDisposition,
			childs: [
				createElement('span', {
					i18n: '#count_y',
				}),
				createElement('input', {
					attributes: {
						type: 'number',
					},
					value: String(this.#customDisposition.countY),
					$change: (event: InputEvent) => {
						this.#customDisposition.countY = Number((event.target as HTMLInputElement).value);
						CharacterManager.refreshCustomDisposition(this.#customDisposition);
					},
				})
			],
		});
		createElement('label', {
			parent: this.#htmlCharacterDisposition,
			childs: [
				createElement('span', {
					i18n: '#count_z',
				}),
				createElement('input', {
					attributes: {
						type: 'number',
					},
					value: String(this.#customDisposition.countZ),
					$change: (event: InputEvent) => {
						this.#customDisposition.countZ = Number((event.target as HTMLInputElement).value);
						CharacterManager.refreshCustomDisposition(this.#customDisposition);
					},
				})
			],
		});

		I18n.i18n();
	}
}
