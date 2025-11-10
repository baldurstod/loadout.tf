import { quat, vec2, vec3, vec4 } from 'gl-matrix';
import { Camera, Composer, DEG_TO_RAD, EntityObserver, EntityObserverEventType, EntityObserverPropertyChangedEvent, Graphics, Group, RAD_TO_DEG, Scene } from 'harmony-3d';
import { addNotification, NotificationType, ShortcutHandler } from 'harmony-browser-utils';
import { arrowDownwardAltSVG, arrowLeftAltSVG, arrowRightAltSVG, arrowUpwardAltSVG, borderClearSVG, brickLayoutSVG, cropPortraitSVG, gridOffsetSVG, gridRegularSVG, lockOpenRightSVG, lockSVG, rotateLeftSVG, rotateRightSVG, tableRowsSVG, viewColumnSVG, zoomInSVG, zoomOutSVG } from 'harmony-svg';
import { JSONArray, JSONObject, Radian } from 'harmony-types';
import { createElement, defineHarmony2dManipulator, defineHarmonyMenu, defineHarmonySlider, defineHarmonySwitch, defineHarmonyTab, defineHarmonyTabGroup, display, HarmonyMenuItem, hide, HTMLHarmony2dManipulatorElement, HTMLHarmonyMenuElement, HTMLHarmonyRadioElement, HTMLHarmonySliderElement, HTMLHarmonySwitchElement, HTMLHarmonyTabElement, HTMLHarmonyToggleButtonElement, I18n, ManipulatorUpdatedEventData, ManipulatorUpdatedEventType, RadioChangedEventData, show, updateElement } from 'harmony-ui';
import printfulCSS from '../../css/printful.css';
import { Panel } from '../enums';
import { categoryHasProducts, categoryHasSubCategories, getAvailableProducts, getCategories, getPlacements, getPlacementsPrices, getProduct, getProductPrice, getProductVariants, getTechniques, getVariant, initProducts, isParent } from '../printful/catalog';
import { GetMockupStyle, GetMockupStyles } from '../printful/mockupstyles';
import { GetMockupTemplate } from '../printful/mockuptemplates';
import { Category } from '../printful/model/category';
import { Pattern, Positioning, Techniques } from '../printful/model/enums';
import { MockupTemplate } from '../printful/model/mockuptemplate';
import { Product } from '../printful/model/product';
import { ProductPlacement } from '../printful/model/productplacement';
import { createProductRequest, createProductRequestPlacement } from '../printful/model/requests/shop/createproduct';
import { Technique } from '../printful/model/technique';
import { PlacementPreset, PlacementSource, ProductPreset } from '../printful/preset';
import { PrintfulProductElement } from '../printful/printfulproduct';
import { fetchShopAPI } from '../printful/shop';
import { formatPrice } from '../printful/utils';
import { DynamicPanel } from './dynamicpanel';
import { Controller, ControllerEvent } from '../controller';
import { activeCamera, loadoutScene } from '../loadout/scene';
export { PrintfulProductElement };

const MOVE_SCALE = 5;
const ROTATE_SCALE = 10;

const APPEND_PRINT_IMAGE_TO_BODY = false;

const PatternsIcons = new Map<Pattern, string>([
	[Pattern.None, cropPortraitSVG],
	[Pattern.Horizontal, viewColumnSVG],
	[Pattern.Vertical, tableRowsSVG],
	[Pattern.FullDrop, gridRegularSVG],
	[Pattern.HalfDrop, gridOffsetSVG],
	[Pattern.Brick, brickLayoutSVG],
]);

const PatternShowControls = new Map<Pattern, [boolean, boolean]>([
	[Pattern.None, [false, false]],
	[Pattern.Horizontal, [true, false]],
	[Pattern.Vertical, [false, true]],
	[Pattern.FullDrop, [true, true]],
	[Pattern.HalfDrop, [true, true]],
	[Pattern.Brick, [true, true]],
]);

type getSourceImageResult = [HTMLImageElement, ImageBitmap];

const overSample = 2;

export class PrintfulPanel extends DynamicPanel {
	#htmlTemplateTab?: HTMLHarmonyTabElement;
	#htmlProductTab?: HTMLHarmonyTabElement;
	#htmlCreateProductSuccess?: HTMLElement;
	#htmlCreateProducts?: HTMLElement;
	#htmlEnableNotificationsButton?: HTMLElement;
	#notificationPromiseResolve?: (value: NotificationPermission) => void;
	#notificationPromise?: Promise<NotificationPermission>;
	#htmlCreateProductButton?: HTMLButtonElement;
	//#typeNameOptionPool = new Set<HTMLOptionElement>();
	#productOption = new Map<HTMLOptionElement, Product>();
	#productList = new Map<HTMLElement, Product>();
	#techniqueOptions = new Map<HTMLOptionElement, Technique>();
	//#placementOptions = new Map<HTMLOptionElement, Placement>();
	//#renderTarget?: RenderTarget;
	//#shadowRoot?: ShadowRoot;
	#printFiles = new Map<number, Map<any, Map<any, JSONObject>>>();
	//#mockupTemplates = new Map<number, JSONObject/*TODO: create a mockup templates type*/>();
	//#htmlProductTypeNames?: HTMLSelectElement;
	#htmlProducts?: HTMLSelectElement;
	#htmlProductsList?: HTMLElement;
	//#htmlVariants?: HTMLSelectElement;
	#htmlTechniques?: HTMLHarmonyRadioElement;
	#htmlPlacements?: HTMLHarmonyRadioElement;
	#htmlPatterns?: HTMLHarmonyRadioElement;
	#placementsPrice = new Map<string, HTMLElement>();
	#placementsButtons = new Map<string, HTMLButtonElement>();
	#htmlProductOptions?: HTMLElement;
	#htmlBasicControls?: HTMLElement;
	#htmlTemplateContainer?: HTMLElement;
	#htmlTemplateControlsContainer?: HTMLElement;
	//#htmlTemplateControlLocked?: HTMLHarmonySwitchElement;
	#htmlTemplateRemovePlacement?: HTMLButtonElement;
	#htmlTemplateRegeneratePlacement?: HTMLButtonElement;
	#htmlTemplateControlTransparent?: HTMLHarmonySwitchElement;
	#htmlTemplateControlWidth?: HTMLHarmonySliderElement;
	#htmlTemplateControlHeight?: HTMLHarmonySliderElement;
	#htmlTemplateControlRotation?: HTMLHarmonySliderElement;
	#htmlTemplateControlVerticalGap?: HTMLHarmonySliderElement;
	#htmlTemplateControlHorizontalGap?: HTMLHarmonySliderElement;
	#htmlTemplateCameraControls?: HTMLElement;
	#htmlTemplateCanvasBackground?: HTMLCanvasElement;
	#htmlTemplateCanvas?: HTMLCanvasElement;
	/** Canvas used to render the print file */
	#offscreenCanvas?: OffscreenCanvas;
	#htmlTemplateCanvasForeground?: HTMLCanvasElement;
	#htmlManipulator?: HTMLHarmony2dManipulatorElement;
	#htmlDrawGrid?: HTMLHarmonyToggleButtonElement;
	#htmlPlacementSource?: HTMLHarmonyRadioElement;
	#htmlCategories?: HTMLHarmonyMenuElement;
	#sceneContainer = new Group({ name: 'Printful scene container' });
	#shopEndpoint = '__shopEndpoint__';
	#htmlTemplateCanvasContainer?: HTMLElement;
	#templateScale = 1;
	//#printfulEndpoint = '__printfulEndpoint__';
	#htmlProductPrice?: HTMLElement;
	#htmlProductTitle?: HTMLElement;
	#htmlSymmetry?: HTMLElement;
	#htmlSpaceBetween?: HTMLElement;
	#camera = new Camera({ name: 'Printful camera' });
	#scene = new Scene();
	#originalCamera?: Camera;
	#refreshing = false;
	#refreshingProducts = false;
	#typeOptions = new Set<string>();
	//#typeNameOptions = new Map<string, string>();
	#productOptions = new Set<any/*TODO: improve type*/>();
	#htmlVariantOptions = new Map<number, HTMLOptionElement>();
	//#htmlTypeOptions = new Set<string>();
	//#template = { pattern: Pattern.None, transparent: true, symmetry: false, scale: 1, verticalGap: 0, horizontalGap: 0, verticalOffset: 0, horizontalOffset: 0, width: 1, height: 1 };
	#htmlProductDesciptionImage?: HTMLElement;
	#htmlSelectProductButton?: HTMLButtonElement;
	#htmlProductSizes?: HTMLElement;
	#htmlProductColors?: HTMLElement;
	#htmlProductDesciption?: HTMLElement;
	#htmlVariantImage?: HTMLImageElement;
	#htmlTemplateCanvasBackgroundCtx: CanvasRenderingContext2D | null = null;
	#htmlTemplateCanvasCtx: CanvasRenderingContext2D | null = null;
	#htmlTemplateCanvasForegroundCtx: CanvasRenderingContext2D | null = null;
	#offscreenCanvasCtx: OffscreenCanvasRenderingContext2D | null = null;
	#composer?: Composer;
	//#testImage: string = '';//TODO: rename
	#generateTimeout?: ReturnType<typeof setTimeout>;
	//#templateBackgroundImage?: HTMLImageElement;
	//#templateForegroundImage?: HTMLImageElement;
	#productInizialized = false;
	//#products = new Map<number, any/*TODO: create a proper product object*/>();
	#productFilter: { categoryId: number } = { categoryId: 0 };
	//#selection: { productId: number, variantId: number, technique: Techniques, placement: string, orientation?: Orientation } = { productId: -1, variantId: -1, technique: Techniques.Unknwown, placement: '' };
	#initOnce = true;
	#initCategoriesOnce = true;
	#categories: Array<number> = [];
	#htmlCategoryMenuItems: Map<number, any> = new Map();
	#productPreset: ProductPreset = new ProductPreset();
	#placeManipulator = true;
	#dirtyBackground = true;
	#dirtyForeground = true;
	#generating = false;
	#generateAgain = false;

	constructor() {
		super(Panel.Printful, [printfulCSS]);

		Controller.addEventListener(ControllerEvent.TogglePanel, (event: Event) => {
			if ((event as CustomEvent<Panel>).detail == Panel.Printful) {
				this.#initSale(loadoutScene, activeCamera);
			}
		});


		hide(this.getShadowRoot());
		//super();
		defineHarmonySwitch();
		defineHarmonyTab();
		defineHarmonyTabGroup();
		defineHarmonySlider();
		defineHarmonyMenu();
		defineHarmony2dManipulator();

		this.#typeOptions[Symbol.iterator] = function* (): SetIterator<string> {
			yield* [...this.keys()].sort(
				(a, b) => {
					return a < b ? -1 : 1;
				}
			);
		};

		/*
		this.#typeNameOptions[Symbol.iterator] = function* (): MapIterator<[string, string]> {
			yield* [...this.entries()].sort(
				(a, b) => {
					return a[0] < b[0] ? -1 : 1;
				}
			);
		};
		*/

		this.#productOptions[Symbol.iterator] = function* (): SetIterator<any> {
			yield* [...this.keys()].sort(
				(a, b) => {
					return a.model < b.model ? -1 : 1;
				}
			);
		};
		//this.variantOptions = new Set();


		//this.filter = { type: '', typeName: '' };

		this.#scene.addChild(this.#sceneContainer);
		this.#scene.addChild(this.#camera);
		//Graphics.ready.then(() => this.#renderTarget = new RenderTarget());
		EntityObserver.addEventListener(EntityObserverEventType.PropertyChanged, (event: Event) => this.#handlePropertyChanged((event as CustomEvent).detail));

	}

	/*
	get htmlElement() {
		return this.#shadowRoot?.host ?? this.#initHtml();
	}
	*/

	initHTML(): void {
		ShortcutHandler.addEventListener('app.shortcuts.printful.refreshtemplate', (event) => this.#refreshTemplate());
		//let htmlElement = createElement('div', {class: 'printful-client'});


		const shadowRoot = this.getShadowRoot();
		shadowRoot.host.addEventListener('click', () => this.close());

		createElement('div', {
			parent: shadowRoot,
			class: 'inner-panel printful',
			child: createElement('div', {
				class: 'printful-client',
				child: createElement('harmony-tab-group', {
					class: 'printful-tab-group',
					adoptStyle: printfulCSS,
					childs: [
						this.#initSelectProductTab(),
						this.#initTemplateTab(),
						this.#initProductTab(),

					],
				}),
			}),
			events: {
				click: (event: Event) => event.stopPropagation(),
			},
		});


		/*let htmlCloseButton = createElement('div', {
			class: 'printful-client-close',
			innerHTML: CLOSE_SVG,
			events: {
				click: () => this.hide()
			}
		});*/

		/*
				let htmlTabGroup = createElement('harmony-tab-group', { class:'printful-tab-group' });
				htmlTabGroup.append(this.#initSelectProductTab());
				htmlTabGroup.append(this.#initTemplateTab());
				htmlTabGroup.append(this.#initProductTab());
		*/

		//this.htmlCreateSyncProduct = createElement('button');
		//this.htmlCreateSyncProduct.innerHTML = 'create sync product';
		//this.htmlGetPrintFiles = createElement('button');
		//this.htmlGetPrintFiles.innerHTML = 'print files';
		//let htmlGeneratePrintFile = createElement('button');
		//htmlGeneratePrintFile.innerHTML = 'generate printfile';


		//this.htmlCreateSyncProduct.addEventListener('click', event => this.#createSyncProduct());
		//this.htmlGetPrintFiles.addEventListener('click', event => this._getPrintFiles());
		//htmlGeneratePrintFile.addEventListener('click', event => this.#generateTemplates(true));

		/*htmlElement.append(htmlCloseButton, this.htmlCreateSyncProduct, htmlGeneratePrintFile,
			htmlTemplateContainer);*/
		//		this.#htmlElement.append(/*htmlCloseButton, */htmlTabGroup);

		//this.#htmlElement = htmlElement;
	}

	#initSelectProductTab() {
		let htmlProductSelectionTab = createElement('harmony-tab', { 'data-i18n': '#select_product', class: 'printful-template-tab product-tab' }) as HTMLHarmonyTabElement;

		this.#htmlCategories = createElement('harmony-menu', {
			parent: htmlProductSelectionTab,
			class: 'categories',
		}) as HTMLHarmonyMenuElement;

		this.#htmlProductsList = createElement('div', {
			class: 'products',
			parent: htmlProductSelectionTab,
			childs: [
				createElement('label', {
					hidden: true,
					childs: [
						//createElement('span', { i18n: '#products' }),
						this.#htmlProducts = createElement('select', {
							hidden: true,
							events: {
								change: () => {
									if (this.#htmlProducts!.selectedOptions[0]) {
										this.#selectProduct(this.#productOption.get(this.#htmlProducts!.selectedOptions[0])?.id as number);
									}
								},
							}
						}) as HTMLSelectElement,
					],
				}),
				//				this.#htmlProductsList = createElement('div', {}),

				/*
				createElement('label', {
					childs: [
						createElement('span', { i18n: '#variants' }),
						this.#htmlVariants = createElement('select', {
							events: {
								change: () => this.#selectVariant(Number(this.#htmlVariants!.selectedOptions[0].value))
							}
						}) as HTMLSelectElement,
					],
				}),
				*/
				/*
				createElement('label', {
					hidden: true,
					childs: [
						createElement('span', { i18n: '#techniques' }),

						this.#htmlTechniques = createElement('harmony-radio', {
							disabled: true,
							$change: (event: CustomEvent) => event.detail.state && this.#selectTechnique(event.detail.value)
						}) as HTMLHarmonyRadioElement,
					],
				}),
				*/

				this.#htmlProductDesciptionImage = createElement('div', {
					class: 'printful-product',
					hidden: true,
				}),

				this.#htmlSelectProductButton = createElement('button', {
					class: 'printful-create-template',
					hidden: true,
					disabled: true,
					i18n: '#select_product',
					parent: htmlProductSelectionTab,
					$click: () => this.#displayTemplateTab(),
				}) as HTMLButtonElement,
			]
		});

		this.#htmlVariantImage = createElement('img', { class: 'printful-product-image', parent: this.#htmlProductDesciptionImage }) as HTMLImageElement;

		createElement('div', {
			class: 'printful-product-description-price',
			parent: this.#htmlProductDesciptionImage,
			childs: [
				/*
				this.#htmlProductTitle = createElement('div', {
					class: 'title',
				}),
				*/
				//this.#htmlProductSizes = createElement('div', { class: 'sizes', hidden: true }),
				//this.#htmlProductColors = createElement('div', { class: 'colors', hidden: true }),
				createElement('div', {
					class: 'printful-product-price',
					hidden: true,
					i18n: {
						innerText: '#product_price',
						values: {
							price: 0,
						}
					},
				}),
				this.#htmlProductDesciption = createElement('div', {
					class: 'printful-product-description',
				}),
			]
		});

		return htmlProductSelectionTab;
	}

	#initTemplateTab() {
		let htmlTemplate;
		this.#htmlTemplateTab = createElement('harmony-tab', {
			class: 'templates',
			'data-i18n': '#template',
			'disabled': true,
			$activated: () => this.#refreshTemplate(),
			childs: [
				createElement('span', {
					class: 'product-title-price',
					childs: [
						this.#htmlProductTitle = createElement('span', {
							class: 'product-title',
						}),
						this.#htmlProductPrice = createElement('span', {
							class: 'product-price',
						}),
					]
				}),
				this.#htmlPlacements = createElement('harmony-radio', {
					class: 'placements',
					$change: (event: CustomEvent) => event.detail.state && this.#selectPlacement(event.detail.value)
				}) as HTMLHarmonyRadioElement,
				htmlTemplate = createElement('div', {
					class: 'printful-template-container',
				}),
			]
		}) as HTMLHarmonyTabElement;
		/*let htmlRefreshTemplate = createElement('button', {
			i18n:'#refresh_template',
			parent: htmlTemplate,
			events: {
				click: event => this.#refreshTemplate()
			},
		});*/

		/*this.#htmlCreateProductButton = createElement('button', {
			i18n:'#create_product',
			parent: htmlTemplate,
			events: {
				click: event => this.#createProduct()
			},
		});*/

		/*
		const duplicateOptions = [];
		for (let i = 1; i < 10; ++i) {
			duplicateOptions.push(createElement('option', { value: i, innerHTML: i }));
		}
		*/

		const patternOptions = [];
		for (const [pattern, icon] of PatternsIcons) {
			patternOptions.push(createElement('button', {
				value: pattern,
				innerHTML: icon,
				...(pattern == Pattern.None && { selected: true }),
			}));

		}

		createElement('div', {
			parent: htmlTemplate,
			class: 'printful-template-controls',
			childs: [
				this.#htmlProductOptions = createElement('div', {
					class: 'product-options',
					childs: [
						createElement('label', {
							childs: [
								createElement('span', { i18n: '#sizes' }),
								this.#htmlProductSizes = createElement('span', { class: 'sizes', hidden: true }),
							]
						}),
						this.#htmlProductColors = createElement('div', { class: 'colors', hidden: true }),

						createElement('label', {
							childs: [
								createElement('span', { i18n: '#techniques' }),

								this.#htmlTechniques = createElement('harmony-radio', {
									disabled: true,
									$change: (event: CustomEvent) => event.detail.state && this.#selectTechnique(event.detail.value)
								}) as HTMLHarmonyRadioElement,
							],
						}),

					],
				}),
				this.#htmlBasicControls = createElement('div', {
					class: 'basic-controls',
					childs: [
						this.#htmlTemplateRemovePlacement = createElement('button', {
							class: 'remove-placement',
							i18n: '#remove_placement',
							$click: () => this.#setPlacementSource(PlacementSource.None),
						}) as HTMLButtonElement,

						this.#htmlTemplateRegeneratePlacement = createElement('button', {
							class: 'regenerate-placement',
							i18n: '#regenerate_placement',
							$click: () => {
								this.#productPreset.getSelectedPreset().regeneratePlacement();
								this.#generateTemplates();
							},
						}) as HTMLButtonElement,

						this.#htmlTemplateControlTransparent = createElement('harmony-switch', {
							'data-i18n': '#transparent_background',
							state: true,
							events: {
								change: (event: Event) => this.#setTemplateTransparent((event.target as HTMLHarmonySwitchElement).state as boolean),
							},
						}) as HTMLHarmonySwitchElement,
						/*
						createElement('label', {
							childs: [
								createElement('span', {
									i18n: '#repeat',
								}),
								createElement('select', {
									childs: duplicateOptions,
									events: {
										input: (event: Event) => this.#setTemplateDuplicate(Number((event.target as HTMLSelectElement).value))
									}
								}),
							],
						}),
						*/
						createElement('label', {
							childs: [
								createElement('span', {
									i18n: '#pattern',
								}),
								this.#htmlPatterns = createElement('harmony-radio', {
									childs: patternOptions,
									/*
									events: {
										input: (event: Event) => this.#setTemplateDuplicate(Number((event.target as HTMLSelectElement).value))
									},
									*/
									events: {
										change: (event: CustomEvent<RadioChangedEventData>) => {
											if (event.detail.state) {
												this.#setTemplatePattern(event.detail.value as Pattern);
											}
										},
									},
								}) as HTMLHarmonyRadioElement,
							],
						}),

						createElement('harmony-slider', {
							label: '#scale',
							min: 0.5,
							max: 2,
							'has-input': 1,
							'input-step': 0.01,
							value: 1,
							$input: (event: Event) => this.#setTemplateScale(Number((event.target as HTMLInputElement).value)),
						}) as HTMLInputElement,

						this.#htmlTemplateControlWidth = createElement('harmony-slider', {
							label: '#image_width',
							min: 0.05,
							max: 1,
							'has-input': 1,
							'input-step': 0.01,
							value: 0.5,
							//hidden: true,
							$input: (event: Event) => {
								this.#setTemplateWidth(Number((event.target as HTMLInputElement).value));
								this.#generateTemplates();
							},
						}) as HTMLHarmonySliderElement,

						this.#htmlTemplateControlHeight = createElement('harmony-slider', {
							label: '#image_height',
							min: 0.05,
							max: 1,
							'has-input': 1,
							'input-step': 0.01,
							value: 0.5,
							//hidden: true,
							$input: (event: Event) => {
								this.#setTemplateHeight(Number((event.target as HTMLInputElement).value));
								this.#generateTemplates();
							},
						}) as HTMLHarmonySliderElement,

						this.#htmlTemplateControlRotation = createElement('harmony-slider', {
							label: '#image_rotation',
							min: -180,
							max: 180,
							'has-input': 1,
							'input-step': 0.01,
							value: 0,
							$input: (event: Event) => {
								this.#setTemplateRotation(Number((event.target as HTMLInputElement).value) * DEG_TO_RAD);
								this.#generateTemplates();
							},
						}) as HTMLHarmonySliderElement,

						this.#htmlTemplateControlHorizontalGap = createElement('harmony-slider', {
							label: '#horizontal_gap',
							min: -90,
							max: 90,
							'has-input': 1,
							'input-step': 0.1,
							value: 0,
							hidden: true,
							$input: (event: Event) => this.#setTemplateHorizontalGap(Number((event.target as HTMLInputElement).value) * 0.01),
						}) as HTMLHarmonySliderElement,

						this.#htmlTemplateControlVerticalGap = createElement('harmony-slider', {
							label: '#vertical_gap',
							min: -90,
							max: 90,
							'has-input': 1,
							'input-step': 0.01,
							value: 0,
							hidden: true,
							$input: (event: Event) => this.#setTemplateVerticalGap(Number((event.target as HTMLInputElement).value) * 0.01),
						}) as HTMLHarmonySliderElement,


						this.#htmlSymmetry = createElement('label', {
							hidden: true,
							childs: [
								createElement('span', {
									i18n: '#symmetry',
								}),
								createElement('harmony-switch', {
									events: {
										change: (event: Event) => this.#setTemplateSymmetry((event.target as HTMLHarmonySwitchElement).state as boolean),
									},
								}),
							],
						}),
						/*
						this.#htmlSpaceBetween = createElement('label', {
							hidden: true,
							childs: [
								createElement('span', {
									i18n: '#space_between',
								}),
								this.#htmlTemplateControlsSpaceBetween = createElement('input', {
									type: 'range',
									min: -500,
									max: 500,
									events: {
										input: (event: Event) => this.#setTemplateSpaceBetween(Number((event.target as HTMLInputElement).value)),
									},
								}) as HTMLInputElement,
								this.#htmlTemplateControlsSpaceBetweenInput = createElement('input', {
									events: {
										input: (event: Event) => this.#setTemplateSpaceBetween(Number((event.target as HTMLInputElement).value)),
										keydown: (event: Event) => event.stopPropagation(),
									},
								}) as HTMLInputElement,
							],
						}),
						*/
					],
				}),
				createElement('div', {
					class: 'camera-controls',
					childs: [
						createElement('div', {
							class: 'rotation-controls',
							childs: [
								createElement('span', {
									class: 'rotate-left camera-control',
									innerHTML: rotateLeftSVG,
									events: {
										click: () => this.#rotateTemplate(0, 0, ROTATE_SCALE * DEG_TO_RAD)
									},
								}),
								createElement('span', {
									class: 'rotate-right camera-control',
									innerHTML: rotateRightSVG,
									events: {
										click: () => this.#rotateTemplate(0, 0, -ROTATE_SCALE * DEG_TO_RAD)
									},
								}),
								createElement('span', {
									class: 'camera-control',
									innerHTML: zoomInSVG,
									events: {
										click: () => this.#moveTemplate(0, -MOVE_SCALE, 0)
									}
								}),
								createElement('span', {
									class: 'camera-control',
									innerHTML: zoomOutSVG,
									events: {
										click: () => this.#moveTemplate(0, MOVE_SCALE, 0)
									}
								}),
								/*createElement('span', {
									class: 'rotate-up',
									i18n: '#rotate_up',
									events: {
										click: event => this.#rotateTemplate(ROTATE_SCALE * DEG_TO_RAD, 0, 0)
									},
								}),
								createElement('span', {
									class: 'rotate-down',
									i18n: '#rotate_down',
									events: {
										click: event => this.#rotateTemplate(-ROTATE_SCALE * DEG_TO_RAD, 0, 0)
									},
								}),*/
								/*createElement('button', {
									class: 'reset-rotation',
									i18n: '#reset_rotation',
									events: {
										click: event => this.#resetRotation()
									},
								}),*/
							],
						}),
						createElement('div', {
							class: 'translation-controls',
							childs: [
								createElement('span', {
									class: 'camera-control',
									innerHTML: arrowLeftAltSVG,
									events: {
										click: () => this.#moveTemplate(-MOVE_SCALE, 0, 0)
									}
								}),
								createElement('span', {
									class: 'camera-control',
									innerHTML: arrowRightAltSVG,
									events: {
										click: () => this.#moveTemplate(MOVE_SCALE, 0, 0)
									}
								}),
								createElement('span', {
									class: 'camera-control',
									innerHTML: arrowUpwardAltSVG,
									events: {
										click: () => this.#moveTemplate(0, 0, MOVE_SCALE)
									}
								}),
								createElement('span', {
									class: 'camera-control',
									innerHTML: arrowDownwardAltSVG,
									events: {
										click: () => this.#moveTemplate(0, 0, -MOVE_SCALE)
									}
								}),
							],
						}),
						createElement('div', {
							class: 'reset-controls',
							childs: [
								createElement('button', {
									class: 'reset-position',
									i18n: '#reset_position',
									events: {
										click: () => this.#resetPosition()
									},
								}),
								createElement('button', {
									class: 'reset-rotation',
									i18n: '#reset_rotation',
									events: {
										click: () => this.#resetRotation()
									},
								}),
							],
						}),
					],
				}),
				this.#htmlCreateProductButton = createElement('button', {
					class: 'create-product',
					i18n: '#create_product',
					parent: htmlTemplate,
					events: {
						click: () => this.#createProduct()
					},
				}) as HTMLButtonElement,
			]
		});

		createElement('div', {
			parent: htmlTemplate,
			class: 'printful-template-2',
			childs: [
				this.#htmlTemplateContainer = createElement('div', {
					parent: htmlTemplate,
					class: 'printful-template-2',
				}),


				this.#htmlTemplateControlsContainer = createElement('div', {
					parent: htmlTemplate,
					class: 'printful-canvas-controls',
					childs: [
						this.#htmlDrawGrid = createElement('harmony-toggle-button', {
							class: 'toggle-grid',
							state: '0',
							child: createElement('div', {
								slot: 'on',
								innerHTML: borderClearSVG,
							}),
							$change: () => this.#refreshTemplate(),
						}) as HTMLHarmonyToggleButtonElement,

						this.#htmlPlacementSource = createElement('harmony-radio', {
							class: 'placement-source',
							childs: [
								createElement('button', {
									i18n: '#remove_placement',
									value: PlacementSource.None,
								}) as HTMLButtonElement,
								createElement('button', {
									i18n: '#use_placement',
									value: PlacementSource.Scene,
								}) as HTMLButtonElement,
								/*
								createElement('button', {
									i18n: '#use_image',
									value: PlacementSource.Image,
								}) as HTMLButtonElement,
								*/
							],
							$change: (event: CustomEvent) => { if (event.detail.state) { this.#setPlacementSource(event.detail.value) } },
						}) as HTMLHarmonyRadioElement,
					]
				}),
			]
		});

		const resizeCallback: ResizeObserverCallback = (entries) => {
			entries.forEach(entry => {
				if (entry.target == this.#htmlTemplateContainer) {
					this.#resizeTemplateCanvas();
				}
			});
		};
		const resizeObserver = new ResizeObserver(resizeCallback);
		resizeObserver.observe(this.#htmlTemplateContainer);

		this.#htmlTemplateCameraControls = createElement('div', {
			childs: [

			]
		});
		hide(this.#htmlTemplateCameraControls);

		this.#htmlTemplateCanvasContainer = createElement('div', {
			parent: this.#htmlTemplateContainer,
			class: 'printful-client-canvas',

			events: {
				mouseover: () => show(this.#htmlTemplateCameraControls),
				mouseout: () => hide(this.#htmlTemplateCameraControls),
				wheel: (event: WheelEvent) => this.#moveTemplate(0, event.deltaY * 0.01 * MOVE_SCALE, 0),
			},
			childs: [
				this.#htmlTemplateCanvasBackground = createElement('canvas') as HTMLCanvasElement,
				this.#htmlTemplateCanvas = createElement('canvas') as HTMLCanvasElement,
				this.#htmlTemplateCanvasForeground = createElement('canvas') as HTMLCanvasElement,
				this.#htmlTemplateCameraControls,
				this.#htmlManipulator = createElement('harmony-2d-manipulator', {
					'resize-origin': 'center',
					$change: async (event: CustomEvent<ManipulatorUpdatedEventData>) => {
						const manipulator = event.target as HTMLHarmony2dManipulatorElement;
						//console.info(event.detail.width, event.detail.height);
						const template = await GetMockupTemplate(this.#productPreset.productId, this.#productPreset.variantId, this.#productPreset.getTechnique(), this.#productPreset.getSelectedPlacement());
						if (template) {
							if (event.detail.type == ManipulatorUpdatedEventType.Rotation) {
								this.#setTemplateRotation((event.detail.rotation));
							}

							if (event.detail.type == ManipulatorUpdatedEventType.Size) {
								this.#setTemplateWidth(event.detail.width / template.printAreaWidth);
								this.#setTemplateHeight(event.detail.height / template.printAreaHeight);
							}

							this.#setTemplateHorizontalOffset(((event.detail.position.x) - (template.printAreaLeft + template.printAreaWidth * 0.5)) / template.printAreaWidth);
							this.#setTemplateVerticalOffset(((event.detail.position.y) - (template.printAreaTop + template.printAreaHeight * 0.5)) / template.printAreaHeight);
							this.#generateTemplates();
							this.#updatePatternInputs(event.detail, template);
						}
					},
				}) as HTMLHarmony2dManipulatorElement,
			]
		});
		this.#htmlTemplateCanvasBackgroundCtx = this.#htmlTemplateCanvasBackground.getContext('2d');
		this.#htmlTemplateCanvasCtx = this.#htmlTemplateCanvas.getContext('2d');
		this.#htmlTemplateCanvasForegroundCtx = this.#htmlTemplateCanvasForeground.getContext('2d');

		this.#htmlTemplateCanvas!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvas!.style.opacity = String(0.75);
		this.#htmlTemplateCanvasBackground!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvasForeground!.style.transformOrigin = 'top left';

		this.#htmlManipulator.set({
			rotation: 0,
			left: -100,
			top: -100,
			width: 0,
			height: 0,
		});

		this.#offscreenCanvas = new OffscreenCanvas(0, 0);
		this.#offscreenCanvasCtx = this.#offscreenCanvas.getContext('2d');

		return this.#htmlTemplateTab;
	}

	#updatePatternInputs(data: ManipulatorUpdatedEventData, template: MockupTemplate): void {
		this.#htmlTemplateControlWidth!.setValue(data.width / template.printAreaWidth);
		this.#htmlTemplateControlHeight!.setValue(data.height / template.printAreaHeight);
		this.#htmlTemplateControlRotation?.setValue(data.rotation * RAD_TO_DEG);
	}

	#updateControls() {
		const preset = this.#productPreset.getSelectedPreset();

		this.#htmlPatterns?.select(preset.getPattern());
		this.#htmlTemplateControlTransparent!.state = preset.isTransparent();
		this.#htmlTemplateControlWidth!.setValue(preset.getWidth());
		this.#htmlTemplateControlHeight!.setValue(preset.getHeight());
		this.#htmlTemplateControlRotation!.setValue(preset.getRotation() * RAD_TO_DEG);
		this.#htmlTemplateControlVerticalGap!.setValue(preset.getVerticalGap() * 100);
		this.#htmlTemplateControlHorizontalGap!.setValue(preset.getHorizontalGap() * 100);
	}

	#resizeTemplateCanvas() {
		if (!this.#htmlTemplateContainer || !this.#htmlTemplateCanvasContainer) {
			return;
		}

		const outRect = this.#htmlTemplateContainer.getBoundingClientRect();
		const inRect = this.#htmlTemplateCanvasContainer.getBoundingClientRect();

		if (inRect.width == 0 || inRect.height == 0) {
			return;
		}

		const w = outRect.width / inRect.width * this.#templateScale;
		const h = outRect.height / inRect.height * this.#templateScale;

		let ratio = 1;
		if (w <= h) {
			this.#templateScale = w;
		} else {
			this.#templateScale = h;
		}
		this.#htmlTemplateCanvasContainer.style.transform = `scale(${this.#templateScale})`;
		this.#htmlTemplateTab?.style.setProperty('--harmony-2d-manipulator-radius', `${1 / this.#templateScale}rem`);
		this.#htmlTemplateTab?.style.setProperty('--harmony-2d-manipulator-border', `${1 / (this.#templateScale)}px dashed aqua`);


		const canvasRect = this.#htmlTemplateCanvasContainer.getBoundingClientRect();

		this.#htmlTemplateControlsContainer!.style.width = `${canvasRect.width}px`;
		this.#htmlTemplateControlsContainer!.style.height = `${canvasRect.height}px`;

		//this.#htmlTemplateCanvasContainer.style.transform = `scale(0.3)`;
		//console.log(this.#htmlTemplateCanvasContainer.style);

		//console.log(entry.target, rect);
	}

	#initProductTab() {
		this.#htmlProductTab = createElement('harmony-tab', { 'data-i18n': '#product', 'disabled': true }) as HTMLHarmonyTabElement;

		this.#htmlCreateProductSuccess = createElement('div', { i18n: '#product_successfully_created', class: 'printful-product-created', parent: this.#htmlProductTab, hidden: true });
		this.#htmlCreateProducts = createElement('div', { class: 'printful-products-list', parent: this.#htmlProductTab });
		this.#htmlEnableNotificationsButton = createElement('button', {
			i18n: '#enable_notifications',
			class: 'printful-enable-enable_notifications',
			parent: this.#htmlProductTab,
			hidden: true,
			events: {
				click: () => {
					hide(this.#htmlEnableNotificationsButton);
					Notification.requestPermission().then((permission) => {
						this.#notificationPromiseResolve?.(permission);
					});
				}
			}
		});

		this.#notificationPromise = new Promise(resolve => {
			this.#notificationPromiseResolve = resolve;
		});

		this.#htmlProductTab.addEventListener('activated', () => {
			//this.#htmlTemplateTab.disabled = true;
			//this.#htmlProductSelectionTab.disabled = true;
		});

		return this.#htmlProductTab;
	}


	#enableCreateProductButton() {
		this.#htmlCreateProductButton!.disabled = this.#productPreset.getIncludedPlacements().length == 0;
	}

	#disableCreateProductButton() {
		this.#htmlCreateProductButton!.disabled = true;
	}

	async #createProduct() {
		this.#disableCreateProductButton();
		const success = await this.#generatePrintFiles();

		if (success) {
			this.#createShopProduct();
		} else {
			addNotification(I18n.getString('#failed_to_generate_images'), NotificationType.Error, 0);
		}
	}

	#refreshTemplate() {
		if (this.#refreshing) {
			return;
		}
		this.#dirtyBackground = true;
		this.#dirtyForeground = true;
		try {
			this.#refreshing = true;
			if (this.#originalCamera) {
				this.#camera.copy(this.#originalCamera);
			}
			this.#generateTemplates();
		} finally {
			this.#refreshing = false;
		}
	}

	#displayTemplateTab() {
		if (this.#htmlTemplateTab) {
			this.#htmlTemplateTab.disabled = false;
			this.#htmlTemplateTab.setActive(true);
		}
	}

	#initSale(scene: Scene, camera: Camera, composer?: Composer) {
		//this.#initHtml();
		this.#sceneContainer.addChild(scene);
		this.#camera.copy(camera);
		this.#originalCamera = camera;
		this.#composer = composer;
		this.show();
		//this.#initProducts();
		initProducts();

		//this.#generateTemplates();
		this.#initCategories();
		this.#refreshProducts();
		this.#refreshTemplate();
	}

	close() {
		this.hide();
		this.#sceneContainer.removeChildren();
	}
	/*
	async #createSyncProduct() {
		//this.#processSyncProductSuccess();
		//return;

		let selectedVariant = this.#htmlVariants.selectedOptions[0]?.dataVariant;
		if (selectedVariant) {
			console.log(selectedVariant);

			let fetchOptions: any = {};
			fetchOptions.method = 'POST';
			fetchOptions.headers = {
				'Content-Type': 'application/json',
			};
			fetchOptions.body = JSON.stringify(
				{
					variantId: selectedVariant.id,
					name: selectedVariant.name,
					type: 'default',
					image: this.#testImage//Graphics.canvas.toDataURL()
				}
			);

			let response = await fetch(this.#printfulEndpoint + '/createsyncproduct/', fetchOptions);
			let json = await response.json();
			console.log(json);
			this.#processSyncProductJson(json);
		}
	}
		*/

	async #createShopProduct() {
		/*
		if (!this.#htmlVariants) {
			return;
		}
		*/
		const imageURLs = new Map<PlacementPreset, string>();
		const images: Array<string> = [];
		const placements: Array<PlacementPreset> = [];

		/*
		for (const placement of this.#productPreset.getIncludedPlacements()) {
			const image = placement.getImage();
			if (image) {
				placements.push(placement);
				images.push(image);
			}
		}
			*/
		/*
				const { response: json } = await FetchAPI('add-images', 1, { images: images });
				if (!json || !json.success) {
					addNotification(I18n.getString('#failed_to_create_the_product'), 'error');
					await setTimeoutPromise(2000);
					this.#enableCreateProductButton();
					return;
				}

				console.info(json, placements);

				return;
				*/

		const createProductRequest: createProductRequest = {
			product: {
				product_id: this.#productPreset.productId,
				variant_id: this.#productPreset.variantId,
				technique: this.#productPreset.getTechnique(),
				placements: [],
			}
		};

		for (const placement of this.#productPreset.getIncludedPlacements()) {
			const image = placement.getPrintImage();
			if (image) {
				const p: createProductRequestPlacement = {
					placement: placement.getPlacement(),
					technique: this.#productPreset.getTechnique(),
					image: image.src,
					orientation: placement.orientation,
				};
				createProductRequest.product.placements.push(p);
			}
		}


		console.info(createProductRequest);
		const { response: createProductResponse } = await fetchShopAPI('create-product', 1, createProductRequest);

		if (!createProductResponse.success) {
			addNotification(I18n.getString('#failed_to_create_the_product'), NotificationType.Error, 0);
			return;
		}



		console.log(createProductResponse);
		const products = createProductResponse.result?.products as JSONArray;
		if (!products) {
			return;
		}

		const product = products[0];
		if (!product) {
			return;
		}

		if (this.#htmlProductTab) {
			this.#htmlProductTab.activate();
			this.#htmlProductTab.disabled = false;
		}
		show(this.#htmlCreateProductSuccess);

		let shopUrl = `${this.#shopEndpoint}/@product/${(product as JSONObject).id}`;

		open(shopUrl, '_blank');
		createElement('a', {
			parent: this.#htmlCreateProducts,
			href: shopUrl,
			innerText: shopUrl,
			target: '_blank',
		});




		//const placement = new Placement('front', 'dtg');
		//const layer = new Layer('​https://www.printful.com/static/images/layout/printful-logo.png', new LayerPosition(10, 10, 0, 0));
		//placement.addLayer(layer);

		//console.info(placement.toJSON(), JSON.stringify(placement.toJSON()));



		return;

		//const selectedVariantid: number = Number(this.#htmlVariants.selectedOptions[0]?.getAttribute('data-variant-id'));
		//const selectedVariant = this.#variants.get(selectedVariantid);
		const selectedVariant = 1;
		if (selectedVariant) {
			console.log(selectedVariant);

			let response = await fetch(this.#shopEndpoint + '/api', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					action: 'create-product',
					version: 1,
					params: {
						product: {
							//variant_id: this.#selection.variantId,
							name: 'TODO variant name', //selectedVariant.name,
							type: 'default',
							//image: this.#testImage,
						},
					},
				}),
			});
			let json = await response.json();
			console.log(json);
			this.#processSyncProductJson(json);
		}
	}

	async #processSyncProductJson(json: JSONObject/*TODO: improve type*/) {
		if (json && json.success) {
			this.#processSyncProductSuccess(json.result as JSONObject);
		} else {
			this.#processSyncProductFailure();
		}
	}

	async #processSyncProductSuccess(result: JSONObject/*TODO: improve type*/) {
		console.log(result);
		const products = result.products as JSONArray;
		if (!products) {
			return;
		}

		const product = products[0];
		if (!product) {
			return;
		}

		if (this.#htmlProductTab) {
			this.#htmlProductTab.activate();
			this.#htmlProductTab.disabled = false;
		}
		show(this.#htmlCreateProductSuccess);

		let shopUrl = `${this.#shopEndpoint}/@product/${(product as JSONObject).id}`;

		open(shopUrl, '_blank');
		createElement('a', {
			parent: this.#htmlCreateProducts,
			href: shopUrl,
			innerText: shopUrl,
			target: '_blank',
		});

		//await this.#createProductNotification(result);

		/*
	result:
	external_id: "625176372e09b9"
	id: 271458143
	is_ignored: false
	name: "test"
	synced: 6
	thumbnail_url: "https://printful.loadout.tf/images/1ckdjth1ksgwvchy7l6b16ffvmo148590bahl7jv9f2d3x8lkml4o6jkhq1cu7pn8_thumb"
	variants: 6
	*/
	}

	async #onProductNotificationClicked(json: JSONObject/*TODO: improve type*/) {
		console.log('onProductNotificationClicked');

	}

	async #createProductNotification(json: JSONObject/*TODO: improve type*/) {
		if (await this.#requestNotifications()) {
			let options = { requireInteraction: true };
			let notification = new Notification('Hi there!', options);
			notification.addEventListener('click', () => this.#onProductNotificationClicked(json));
			notification.addEventListener('close', () => this.#onProductNotificationClicked(json));
		}
	}

	async #requestNotifications() {
		if (Notification.permission == 'default') {
			show(this.#htmlEnableNotificationsButton);
			await this.#notificationPromise;
		}

		if (Notification.permission == 'granted') {
			return true;
		} else {
			return false;
		}
	}

	async #processSyncProductFailure() {
		addNotification(I18n.getString('#failed_to_create_the_product'), NotificationType.Error, 0);
	}

	#setTemplateTransparent(transparent: boolean) {
		if (this.#productPreset.getSelectedPreset().isTransparent() == transparent) {
			return;
		}
		this.#productPreset.getSelectedPreset().setTransparent(transparent);
		this.#updateControls();
		this.#generateTemplates();
	}

	#setTemplatePattern(pattern: Pattern) {
		if (pattern == this.#productPreset.getSelectedPreset().getPattern()) {
			return;
		}
		//this.#template.pattern = pattern;
		this.#productPreset.getSelectedPreset().setPattern(pattern);
		this.#updateControls();

		const showControls = PatternShowControls.get(pattern);

		if (showControls) {
			display(this.#htmlTemplateControlWidth, showControls[0]);
			display(this.#htmlTemplateControlHeight, showControls[1]);

			display(this.#htmlTemplateControlHorizontalGap, showControls[0]);
			display(this.#htmlTemplateControlVerticalGap, showControls[1]);
		}

		switch (pattern) {
			case Pattern.FullDrop:
			case Pattern.HalfDrop:
			case Pattern.Brick:
				if (this.#productPreset.getSelectedPreset().getHeight() >= 1) {
					this.#setTemplateHeight(1 / 3);
				}
			// fallthrough
			case Pattern.Horizontal:
				if (this.#productPreset.getSelectedPreset().getWidth() >= 1) {
					this.#setTemplateWidth(1 / 3);
				}
				break;
		}
		this.#generateTemplates();
	}

	#setTemplateScale(scale: number) {
		if (scale == this.#productPreset.getSelectedPreset().getScale()) {
			return;
		}
		//this.#template.scale = scale;
		this.#productPreset.getSelectedPreset().setScale(scale);
		this.#generateTemplates();
	}

	#setTemplateRotation(rotation: Radian) {
		if (rotation == this.#productPreset.getSelectedPreset().getRotation()) {
			return;
		}

		this.#productPreset.getSelectedPreset().setRotation(rotation);
		//this.#htmlTemplateControlRotation?.setValue(rotation * RAD_TO_DEG);
		this.#updateManipulator(undefined, undefined, rotation);
		this.#updateControls();
	}

	#setTemplateWidth(width: number) {
		if (width > 2) {
			return;
		}
		if (width == this.#productPreset.getSelectedPreset().getWidth()) {
			return;
		}

		//this.#template.width = width;
		this.#productPreset.getSelectedPreset().setWidth(width);
		//this.#htmlTemplateControlWidth!.setValue(width);
		this.#updateManipulator(width, undefined, undefined);
		this.#updateControls();
	}

	#setTemplateHeight(height: number) {
		if (height > 2) {
			return;
		}
		if (height == this.#productPreset.getSelectedPreset().getHeight()) {
			return;
		}
		//this.#template.height = height;
		this.#productPreset.getSelectedPreset().setHeight(height);
		//this.#htmlTemplateControlHeight!.setValue(height);
		this.#updateManipulator(undefined, height, undefined);
		this.#updateControls();
	}

	async #updateManipulator(width: number | undefined, height: number | undefined, rotation: Radian | undefined) {
		const template = await GetMockupTemplate(this.#productPreset.productId, this.#productPreset.variantId, this.#productPreset.getTechnique(), this.#productPreset.getSelectedPlacement());
		if (template) {

			this.#htmlManipulator!.set({
				...(width !== undefined) && { width: width * template.printAreaWidth },
				...(height !== undefined) && { height: height * template.printAreaHeight },
				...(rotation !== undefined) && { rotation: rotation },
			});
		}
	}

	#setTemplateHorizontalGap(gap: number) {
		//this.#template.horizontalGap = gap;
		if (this.#productPreset.getSelectedPreset().getHorizontalGap() == gap) {
			return;
		}
		this.#productPreset.getSelectedPreset().setHorizontalGap(gap);
		this.#updateControls();
		this.#generateTemplates();
	}

	#setTemplateVerticalGap(gap: number) {
		//this.#template.verticalGap = gap;
		if (this.#productPreset.getSelectedPreset().getVerticalGap() == gap) {
			return;
		}
		this.#productPreset.getSelectedPreset().setVerticalGap(gap);
		this.#updateControls();
		this.#generateTemplates();
	}

	#setTemplateVerticalOffset(verticalOffset: number) {
		//this.#template.verticalOffset = verticalOffset;
		if (this.#productPreset.getSelectedPreset().getVerticalOffset() == verticalOffset) {
			return;
		}
		this.#productPreset.getSelectedPreset().setVerticalOffset(verticalOffset);
		this.#updateControls();
	}

	#setTemplateHorizontalOffset(horizontalOffset: number) {
		//this.#template.horizontalOffset = horizontalOffset;
		if (this.#productPreset.getSelectedPreset().getHorizontalOffset() == horizontalOffset) {
			return;
		}
		this.#productPreset.getSelectedPreset().setHorizontalOffset(horizontalOffset);
		this.#updateControls();
	}

	#setTemplateSymmetry(symmetry: boolean) {
		//this.#template.symmetry = symmetry;
		this.#productPreset.getSelectedPreset().setSymmetry(symmetry);
		this.#generateTemplates();
	}

	/*
	#setTemplateSpaceBetween(spaceBetween: number) {
		this.#template.spaceBetween = isNaN(spaceBetween) ? 0 : spaceBetween;
		this.#generateTemplates();
		if (!isNaN(spaceBetween)) {
			if (this.#htmlTemplateControlsSpaceBetweenInput) {
				this.#htmlTemplateControlsSpaceBetweenInput.value = String(spaceBetween);
				this.#htmlTemplateControlsSpaceBetween!.value = String(spaceBetween);
			}
		}
	}
	*/

	#moveTemplate(x: number, y: number, z: number) {
		//Note: Camera is by default facing -Z. Switch Y and Z to get an expected behavior
		const v = vec3.fromValues(x, z, -y);

		vec3.transformQuat(v, v, this.#camera.quaternion);
		this.#sceneContainer.translate(v);
		this.#regenerateSelectedPlacement();
		this.#generateTemplates();
	}

	#rotateTemplate(x: number, y: number, z: number) {
		this.#sceneContainer.rotateX(x);
		this.#sceneContainer.rotateY(y);
		this.#sceneContainer.rotateZ(z);
		this.#regenerateSelectedPlacement();
		this.#generateTemplates();
	}

	#resetRotation() {
		this.#sceneContainer.quaternion = quat.create();
		this.#regenerateSelectedPlacement();
		this.#generateTemplates();
	}

	#resetPosition() {
		this.#sceneContainer.position = vec3.create();
		this.#regenerateSelectedPlacement();
		this.#generateTemplates();
	}

	#regenerateSelectedPlacement() {
		this.#productPreset.getSelectedPreset().regeneratePlacement();
	}

	async #generateTemplates(): Promise<boolean> {
		if (this.#generating) {
			this.#generateAgain = true;
			return false;
		}
		this.#generating = true;
		let ret = false;
		try {
			ret = await this.#generateTemplates2();
		} finally {
			this.#generating = false;
			if (this.#generateAgain) {
				this.#generateAgain = false;
				console.info('generate again');
				this.#generateTemplates();
			}
		}
		return ret;
	}

	async #generateTemplates2(): Promise<boolean> {
		if (!this.#htmlTemplateTab?.isActive()/* || this.#htmlManipulator?.isDragging()*/) {
			return false;
		}

		//if (!generatePrintFile) {
		this.#enableCreateProductButton();
		//}

		const selectedVariant = await getVariant(this.#productPreset.variantId);
		const selectedProduct = await getProduct(this.#productPreset.productId);

		if (!selectedVariant || !selectedProduct) {
			return false;
		}

		const template = await GetMockupTemplate(this.#productPreset.productId, this.#productPreset.variantId, this.#productPreset.getTechnique(), this.#productPreset.getSelectedPlacement())//templates[defaultFile?.type];
		if (!template) {
			return false;
		}

		const mockupStyle = await GetMockupStyle(this.#productPreset.productId, this.#productPreset.variantId, this.#productPreset.getTechnique(), this.#productPreset.getSelectedPlacement());
		if (!mockupStyle) {
			return false;
		}

		if (!mockupStyle/* && this.#htmlTemplateControlsSpaceBetween*/) {
			return false;
		}

		const printWidth = Math.ceil(mockupStyle.printAreaWidth * mockupStyle.dpi);
		const printHeight = Math.ceil(mockupStyle.printAreaHeight * mockupStyle.dpi);

		let printFileWidth, printFileHeight, printFileLeft = 0, printFileTop = 0, spaceBetween;
		const printFileCenter = vec2.create();

		let sourceImage: HTMLImageElement | null;
		let sourceBitmap: ImageBitmap | null = null;

		if (this.#productPreset.getSelectedPreset().isDirty()) {
			// generate a new image
			const result = await this.#getSourceImage(printWidth, printHeight);
			if (!result) {
				return false;
			}
			sourceImage = result[0];
			sourceBitmap = result[1];
		} else {
			sourceImage = this.#productPreset.getSelectedPreset().getImage();
		}

		if (!sourceImage) {
			return false;
		}

		this.#productPreset.getSelectedPreset().setImage(sourceImage);

		const clearColor = Graphics.getClearColor();// TODO: remove that, obtain the color from another method

		const presetScale = this.#productPreset.getSelectedPreset().getScale();



		printFileWidth = template.printAreaWidth;
		printFileHeight = template.printAreaHeight;



		let singleImageWidth = printFileWidth * presetScale;
		let singleImageHeight = printFileHeight * presetScale;

		switch (this.#productPreset.getSelectedPreset().getPattern()) {
			case Pattern.Horizontal:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				break;
			case Pattern.Vertical:
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
				break;
			case Pattern.FullDrop:
			case Pattern.HalfDrop:
			case Pattern.Brick:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
				break;
			default:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
		}


		printFileWidth = template.printAreaWidth;
		printFileHeight = template.printAreaHeight;
		printFileLeft = template.printAreaLeft;
		printFileTop = template.printAreaTop;

		printFileCenter[0] = printFileWidth * 0.5 + printFileLeft;
		printFileCenter[1] = printFileHeight * 0.5 + printFileTop;


		if (this.#htmlTemplateCanvas) {
			this.#htmlTemplateCanvas.width = template.templateWidth;
			this.#htmlTemplateCanvas.height = template.templateHeight;
		}

		if (this.#htmlTemplateCanvasBackground!.width != template.templateWidth) {
			this.#htmlTemplateCanvasBackground!.width = template.templateWidth;
			this.#dirtyBackground = true;
		}
		if (this.#htmlTemplateCanvasForeground!.width != template.templateWidth) {
			this.#htmlTemplateCanvasForeground!.width = template.templateWidth;
			this.#dirtyForeground = true;
		}

		if (this.#htmlTemplateCanvasBackground!.height != template.templateHeight) {
			this.#htmlTemplateCanvasBackground!.height = template.templateHeight;
			this.#dirtyBackground = true;
		}
		if (this.#htmlTemplateCanvasForeground!.height != template.templateHeight) {
			this.#htmlTemplateCanvasForeground!.height = template.templateHeight;
			this.#dirtyForeground = true;
		}
		this.#resizeTemplateCanvas();

		if (this.#placeManipulator) {
			this.#placeManipulator = false;
			this.#htmlManipulator?.set({
				rotation: 0,
				left: printFileLeft + printFileWidth * 0.5,
				top: printFileTop + printFileHeight * 0.5,
				width: printFileWidth,
				height: printFileHeight,
			});
		}

		await drawPattern(
			this.#htmlTemplateCanvasCtx!,
			sourceImage,
			printFileLeft,
			printFileTop,
			printFileWidth,
			printFileHeight,
			printFileCenter,
			singleImageWidth,
			singleImageHeight,
			this.#productPreset.getSelectedPreset().getHorizontalOffset(),
			this.#productPreset.getSelectedPreset().getVerticalOffset(),
			this.#productPreset.getSelectedPreset().getRotation(),
			this.#productPreset.getSelectedPreset().getHorizontalGap(),
			this.#productPreset.getSelectedPreset().getVerticalGap(),
			this.#productPreset.getSelectedPreset().getPattern(),
			this.#productPreset.getSelectedPreset().isTransparent(),
			clearColor,
		);

		await this.#generateBackground(template,
			this.#htmlTemplateCanvas!.width,
			this.#htmlTemplateCanvas!.height,
			printFileLeft,
			printFileTop,
			printFileWidth,
			printFileHeight,
		);

		/*
		this.#htmlTemplateCanvas!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvas!.style.opacity = String(0.75);
		this.#htmlTemplateCanvasBackground!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvasForeground!.style.transformOrigin = 'top left';
		this.#resizeTemplateCanvas();
		*/
		/*
		document.body.append(sourceImage);
		sourceImage.style.cssText = 'position:absolute;top:0px;z-index:1000000;pointer-events: none;';
		*/
		return true;
		/*
		if (generatePrintFile) {
			printFileWidth = printWidth;
			printFileHeight = printHeight;

			printFileCenter[0] = printFileWidth * 0.5;
			printFileCenter[1] = printFileHeight * 0.5;

			if (this.#offscreenCanvas) {
				this.#offscreenCanvas.width = printFileWidth;
				this.#offscreenCanvas.height = printFileHeight;
			}
		} else {
			printFileWidth = template.printAreaWidth;
			printFileHeight = template.printAreaHeight;
			printFileLeft = template.printAreaLeft;
			printFileTop = template.printAreaTop;

			if (this.#placeManipulator) {
				this.#placeManipulator = false;
				this.#htmlManipulator?.set({
					rotation: 0,
					left: printFileLeft + printFileWidth * 0.5,
					top: printFileTop + printFileHeight * 0.5,
					width: printFileWidth,
					height: printFileHeight,
				});
			}

			printFileCenter[0] = printFileWidth * 0.5 + printFileLeft;
			printFileCenter[1] = printFileHeight * 0.5 + printFileTop;

			if (this.#htmlTemplateCanvas) {
				this.#htmlTemplateCanvas.width = template.templateWidth;
				this.#htmlTemplateCanvas.height = template.templateHeight;
			}
			show(this.#htmlTemplateCanvasContainer);
		}

		this.#htmlTemplateCanvasCtx!.beginPath();
		this.#htmlTemplateCanvasCtx!.rect(printFileLeft, printFileTop, printFileWidth, printFileHeight);
		this.#htmlTemplateCanvasCtx!.clip();

		const presetScale_test = this.#productPreset.getSelectedPreset().getScale();
		let singleImageWidth_test = printFileWidth * presetScale;
		let singleImageHeight_test = printFileHeight * presetScale;

		switch (this.#productPreset.getSelectedPreset().getPattern()) {
			case Pattern.Horizontal:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				break;
			case Pattern.Vertical:
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
				break;
			case Pattern.FullDrop:
			case Pattern.HalfDrop:
			case Pattern.Brick:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
				break;
			default:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();

		}

		singleImageHeight = Math.round(singleImageHeight);
		singleImageWidth = Math.round(singleImageWidth);

		this.#camera.aspectRatio = singleImageWidth / singleImageHeight;
		this.#htmlTemplateCanvasBackground!.style.backgroundColor = template.backgroundColor || 'rgba(255, 255, 255, 1)';///*selectedVariant.color_code* / ?? '#FFFFFF';
		show(this.#htmlTemplateContainer);
		this.#htmlTemplateCanvasBackground!.width = template.templateWidth;
		if (this.#htmlTemplateCanvasForeground!.width != template.templateWidth) {
			this.#htmlTemplateCanvasForeground!.width = template.templateWidth;
		}
		this.#htmlTemplateCanvasBackground!.height = template.templateHeight;
		if (this.#htmlTemplateCanvasForeground!.height != template.templateHeight) {
			this.#htmlTemplateCanvasForeground!.height = template.templateHeight;
		}
		let ratio = 1000 / Math.max(this.#htmlTemplateCanvas!.width, this.#htmlTemplateCanvas!.height);

		this.#htmlTemplateCanvas!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvas!.style.opacity = String(0.75);
		this.#htmlTemplateCanvasBackground!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvasForeground!.style.transformOrigin = 'top left';
		this.#resizeTemplateCanvas();

		return await this.#drawTemplate(
			this.#htmlTemplateCanvas!.width,
			this.#htmlTemplateCanvas!.height,
			singleImageWidth,
			singleImageHeight,
			printFileCenter,
			printFileLeft,
			printFileTop,
			printFileWidth,
			printFileHeight,
			this.#productPreset.getSelectedPreset(),
			template,
			generatePrintFile,
		);
		*/
	}

	async #generateBackground(template: MockupTemplate, width: number, height: number, printFileLeft: number, printFileTop: number, printFileWidth: number, printFileHeight: number): Promise<void> {
		if (this.#dirtyBackground) {
			this.#htmlTemplateCanvasBackgroundCtx!.clearRect(0, 0, this.#htmlTemplateCanvasBackground!.width, this.#htmlTemplateCanvasBackground!.height);
		}
		if (this.#dirtyForeground) {
			this.#htmlTemplateCanvasForegroundCtx!.clearRect(0, 0, this.#htmlTemplateCanvasForeground!.width, this.#htmlTemplateCanvasForeground!.height);
		}

		this.#htmlTemplateCanvasBackground!.style.backgroundColor = template.backgroundColor || 'rgba(255, 255, 255, 1)';
		if (template.templatePositioning == Positioning.Background) {
			if (template.backgroundURL && this.#dirtyBackground) {
				await drawBackground(this.#htmlTemplateCanvasBackgroundCtx!, template.backgroundURL, width, height);
			}

			if (template.imageURL && this.#dirtyBackground) {
				await drawBackground(this.#htmlTemplateCanvasBackgroundCtx!, template.imageURL, width, height);
			}
		} else {
			//await drawForeground(template.imageURL, canvasWidth, canvasHeight);
			if (template.backgroundURL && this.#dirtyBackground) {
				await drawBackground(this.#htmlTemplateCanvasBackgroundCtx!, template.backgroundURL, width, height);
			}

			if (template.imageURL && this.#dirtyForeground) {
				await drawForeground(this.#htmlTemplateCanvasForegroundCtx!, template.imageURL, width, height);
			}
		}

		this.#dirtyBackground = false;
		this.#dirtyForeground = false;

		if (this.#htmlDrawGrid!.state) {
			await drawGrid(
				this.#htmlTemplateCanvasForegroundCtx!,
				template.templateWidth,
				template.templateHeight,
				printFileLeft,
				printFileTop,
				printFileWidth,
				printFileHeight,
			);
		}

	}

	async #generatePrintFiles(): Promise<boolean> {
		const selectedVariant = await getVariant(this.#productPreset.variantId);
		const selectedProduct = await getProduct(this.#productPreset.productId);

		if (!selectedVariant || !selectedProduct) {
			return false;
		}

		const placements = this.#productPreset.getIncludedPlacements();
		for (const placement of placements) {
			if (!await this.#generatePrintFile(placement)) {
				return false;
			}
		}

		if (APPEND_PRINT_IMAGE_TO_BODY) {
			for (const placement of placements) {
				const image = placement.getPrintImage();
				if (image) {
					document.body.append(image);
					image.style.cssText = 'position:absolute;top:0px;z-index:1000000;pointer-events: none;';
				}
			}
		}

		return true;
	}

	async #generatePrintFile(placement: PlacementPreset): Promise<boolean> {
		/*
		const template = await GetMockupTemplate(this.#productPreset.productId, this.#productPreset.variantId, this.#productPreset.getTechnique(), placement.getPlacement());
		if (!template) {
			return false;
		}
		*/

		const mockupStyle = await GetMockupStyle(this.#productPreset.productId, this.#productPreset.variantId, this.#productPreset.getTechnique(), placement.getPlacement());
		if (!mockupStyle) {
			return false;
		}

		const overSample = 2.0;
		const printWidth = Math.ceil(mockupStyle.printAreaWidth * mockupStyle.dpi) * overSample;
		const printHeight = Math.ceil(mockupStyle.printAreaHeight * mockupStyle.dpi) * overSample;

		//let printFileWidth, printFileHeight, printFileLeft = 0, printFileTop = 0;
		const printFileCenter = vec2.create();

		const sourceImage = placement.getImage();
		if (!sourceImage) {
			return false;
		}

		const clearColor = Graphics.getClearColor();// TODO: remove that, obtain the color from another method

		const presetScale = placement.getScale();

		let singleImageWidth = printWidth * presetScale;
		let singleImageHeight = printHeight * presetScale;

		switch (this.#productPreset.getSelectedPreset().getPattern()) {
			case Pattern.Horizontal:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				break;
			case Pattern.Vertical:
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
				break;
			case Pattern.FullDrop:
			case Pattern.HalfDrop:
			case Pattern.Brick:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
				break;
			default:
				singleImageWidth *= this.#productPreset.getSelectedPreset().getWidth();
				singleImageHeight *= this.#productPreset.getSelectedPreset().getHeight();
		}

		/*
		printFileWidth = template.printAreaWidth;
		printFileHeight = template.printAreaHeight;
		printFileLeft = template.printAreaLeft;
		printFileTop = template.printAreaTop;
		*/

		printFileCenter[0] = printWidth * 0.5;
		printFileCenter[1] = printHeight * 0.5;

		if (this.#offscreenCanvas) {
			this.#offscreenCanvas.width = printWidth;
			this.#offscreenCanvas.height = printHeight;
			this.#offscreenCanvasCtx!.clearRect(0, 0, printWidth, printHeight);
		}

		await drawPattern(
			this.#offscreenCanvasCtx!,
			sourceImage,
			0,
			0,
			printWidth,
			printHeight,
			printFileCenter,
			singleImageWidth,
			singleImageHeight,
			this.#productPreset.getSelectedPreset().getHorizontalOffset(),
			this.#productPreset.getSelectedPreset().getVerticalOffset(),
			this.#productPreset.getSelectedPreset().getRotation(),
			this.#productPreset.getSelectedPreset().getHorizontalGap(),
			this.#productPreset.getSelectedPreset().getVerticalGap(),
			this.#productPreset.getSelectedPreset().getPattern(),
			this.#productPreset.getSelectedPreset().isTransparent(),
			clearColor,
		);

		try {
			const bitmap = this.#offscreenCanvas?.transferToImageBitmap()
			if (bitmap) {
				const image = imageBitmapToImage(bitmap);
				await image.decode();
				placement.setPrintImage(image);
			}
		} catch {
			return false;
		}


		/*
		this.#htmlTemplateCanvas!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvas!.style.opacity = String(0.75);
		this.#htmlTemplateCanvasBackground!.style.transformOrigin = 'top left';
		this.#htmlTemplateCanvasForeground!.style.transformOrigin = 'top left';
		*/
		//this.#resizeTemplateCanvas();
		/*
		document.body.append(sourceImage);
		sourceImage.style.cssText = 'position:absolute;top:0px;z-index:1000000;pointer-events: none;';
		*/
		return true;
	}

	async #getSourceImage(width: number, height: number): Promise<getSourceImageResult | null> {
		if (this.#composer?.enabled) {
			this.#composer.render(0, { DisableToolRendering: true });
		} else {
			Graphics.render(this.#scene, this.#camera, 0, { DisableToolRendering: true, transferBitmap: false, width: width, height: height });
		}

		const bitmap = Graphics.transferOffscreenToImageBitmap();
		if (bitmap) {
			const image = imageBitmapToImage(bitmap);
			await image.decode();
			return [image, bitmap];
		}
		return null;
	}

	async #initCategories() {
		if (!this.#initCategoriesOnce) {
			return;
		}
		this.#initCategoriesOnce = false;

		const products = await getAvailableProducts();
		const categories = await getCategories();

		const item = { name: 'All items', opened: true, submenu: [] };
		this.#htmlCategoryMenuItems.set(0, item);

		for (let category of categories) {
			if (await categoryHasProducts(category, products)) {
				await this.#addCategoryItem(category);
			}
		}

		for (const category of categories) {
			if (this.#htmlCategoryMenuItems.has(category.parentId) && this.#htmlCategoryMenuItems.has(category.id)) {
				this.#htmlCategoryMenuItems.get(category.parentId)?.submenu.push(this.#htmlCategoryMenuItems.get(category.id)!);
			}
		}

		this.#htmlCategories?.show([item]);
	}

	async #refreshProducts() {
		if (this.#refreshingProducts) {
			return;
		}
		this.#refreshingProducts = true;

		try {
			const products = await getAvailableProducts(/*this.#selection.categoyId*/);

			products[Symbol.iterator] = function* (): ArrayIterator<Product> {
				yield* [...this.values()].sort(
					(a, b) => {
						return a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
					}
				);
			};

			for (let product of products) {
				this.#addProductOption(product);
			}

			if (this.#initOnce) {
				this.#selectCategory(1);
				this.#initOnce = false;
			}

		} finally {
			this.#refreshingProducts = false;
		}
	}

	#selectCategory(categoryId: number) {
		this.#productFilter.categoryId = categoryId;
		this.#applyProductFilter();
	}

	async #selectProduct(productId: number) {
		if (productId == this.#productPreset.productId) {
			return;
		}

		this.#htmlSelectProductButton!.disabled = false;

		this.#productPreset = new ProductPreset();
		this.#productPreset.productId = productId;


		this.#htmlTemplateCanvasForegroundCtx!.clearRect(0, 0, this.#htmlTemplateCanvasForeground!.width, this.#htmlTemplateCanvasForeground!.height);
		this.#htmlTemplateCanvasBackgroundCtx!.clearRect(0, 0, this.#htmlTemplateCanvasBackground!.width, this.#htmlTemplateCanvasBackground!.height);

		this.#dirtyForeground = true;
		this.#dirtyBackground = true;

		//this.#selection = { productId: productId, variantId: -1, technique: Techniques.Unknwown, placement: '' };

		const product = await getProduct(productId);

		this.#htmlProducts!.value = String(productId);
		this.#htmlProductTitle!.innerText = '';
		this.#htmlProductPrice!.innerText = '';

		if (product) {
			this.#initProduct(product.id as number);

			this.#htmlProductTitle!.innerText = product.name as string;
			this.#htmlProductPrice!.innerText = await getProductPrice(this.#productPreset.productId);
			this.#htmlProductDesciption!.innerText = product.description as string;

			//hide(this.#htmlProductPrice);
			this.#htmlVariantImage!.src = product.image as string;

			hide(this.#htmlProductSizes);
			hide(this.#htmlProductColors);
			if (product.sizes.length) {
				show(this.#htmlProductSizes);
				if (product.sizes.length == 1) {
					this.#htmlProductSizes!.innerText = `${product.sizes[0]}`;
				} else {
					this.#htmlProductSizes!.innerText = `${product.sizes[0]} - ${product.sizes[product.sizes.length - 1]}`;
				}
			}

			if (product.colors.length) {
				show(this.#htmlProductColors);
				this.#htmlProductColors?.replaceChildren();

				const variants = await getProductVariants(this.#productPreset.productId);
				const color2 = new Map<string, string>;
				if (variants) {
					for (const variant of variants) {
						color2.set(variant.colorCode, variant.colorCode2);
					}
				}

				for (const color of product.colors.toSorted((a, b) => a.getLuminance() - b.getLuminance())) {
					const c2 = color2.get(color.value);
					createElement('div', {
						parent: this.#htmlProductColors,
						class: 'color',
						...(c2) && { style: `background:linear-gradient(to right, ${color.value} 0%, ${color.value} 50%, ${c2} 50%, ${c2} 100%)` },
						...(!c2) && { style: `background-color:${color.value}` },
						$click: () => this.#selectVariantByColor(color.value),
					});
				}
			}
		}
	}

	async #selectVariantByColor(hex: string) {
		const variants = await getProductVariants(this.#productPreset.productId);
		if (!variants) {
			return;
		}

		for (const variant of variants) {
			if (variant.colorCode == hex) {
				if (await this.#selectVariant(variant.id)) {
					this.#regenerateSelectedPlacement();
					this.#generateTemplates();
				}
				return;
			}
		}

	}

	async #selectVariant(variantId: number): Promise<boolean> {
		if (this.#productPreset.variantId == variantId) {
			return false;
		}

		this.#productPreset.variantId = variantId;

		const variant = await getVariant(variantId);
		if (!variant) {
			return false;
		}

		this.#htmlVariantImage!.src = variant.image as string;

		//this.#htmlProductTitle!.innerText = variant.name as string;

		this.#refreshTechniques(/*this.#selection.product?. ?? []*/);
		return true;
	}

	#selectTechnique(technique: string) {
		if (this.#productPreset.getTechnique() == technique) {
			return;
		}
		this.#productPreset.setTechnique(technique as Techniques);//TODO: check technique ?
		this.#refreshPlacements();
	}

	async #refreshTechniques() {
		//const techniques: Array<any/*TODO: create technique type*/> = this.#selection.product?.techniques ?? [];
		this.#htmlTechniques!.clear();

		const techniques = await getTechniques(this.#productPreset.productId/*, this.#selection.variantId*/);

		//this.#htmlTechniques!.disabled = techniques.size < 2;

		let firstTechnique = '';

		for (const technique of techniques) {
			const techniquesOption = createElement('button', {
				innerText: technique.displayName,
				value: technique.key,
				parent: this.#htmlTechniques,
			}) as HTMLOptionElement;

			if (!firstTechnique) {
				firstTechnique = technique.key;
			}

			if (technique.isDefault) {
				firstTechnique = technique.key;
			}

			this.#techniqueOptions.set(techniquesOption, technique);
		}

		//this.#refreshPlacements(product?.placements ?? []);

		this.#htmlTechniques!.select(firstTechnique, true);

		this.#selectTechnique(firstTechnique);
	}

	#lockPlacement(placement: string, lock: boolean) {
		this.#productPreset.getPreset(placement).setLock(lock);
		this.#refreshControls();
	}

	#selectPlacement(placement: string) {
		if (placement == this.#productPreset.getSelectedPlacement()) {
			return;
		}
		this.#productPreset.selectPlacement(placement);//TODO: check technique ?

		//GetPlacementPrice(this.#productPreset.productId, this.#productPreset.technique, this.#productPreset.getSelectedPlacement());
		this.#placeManipulator = true;

		this.#refreshControls();
		this.#updateControls();
		this.#refreshTemplate();
		this.#refreshPlacementsPrice();
	}

	#setPlacementSource(source: PlacementSource) {
		const preset = this.#productPreset.getSelectedPreset();
		if (preset.getSource() == source) {
			return;
		}

		preset.setSource(source);
		this.#refreshControls();
		this.#refreshTemplate();
		this.#refreshPlacementsPrice();
	}

	async #refreshControls() {
		const preset = this.#productPreset.getSelectedPreset();
		if (!this.#htmlBasicControls) {
			return;
		}
		display(this.#htmlManipulator, preset.getSource() == PlacementSource.Scene && !preset.isLocked());

		this.#htmlTemplateRemovePlacement!.disabled = !preset.isIncluded();
		this.#enableCreateProductButton();

		if (preset.isLocked()) {
			this.#htmlBasicControls.classList.add('locked');
			hide(this.#htmlPlacementSource);
		} else {
			this.#htmlBasicControls.classList.remove('locked');
			show(this.#htmlPlacementSource);
		}

		this.#htmlPlacementSource?.select(preset.getSource());
	}

	async #refreshPlacements() {
		const placements: Array<ProductPlacement> = await getPlacements(this.#productPreset.productId, this.#productPreset.getTechnique());

		this.#htmlPlacements!.clear();
		this.#placementsPrice.clear();
		this.#placementsButtons.clear();

		//this.#htmlPlacements!.disabled = placements.length < 2;

		let firstPlacement: ProductPlacement | undefined;

		for (const placement of placements) {

			//const placementPrice = await GetPlacementPrice(this.#selection.productId, this.#selection.technique, placement.getPlacement());
			const placementStyle = await GetMockupStyles(this.#productPreset.productId, this.#productPreset.getTechnique(), placement.getPlacement());
			if (!placementStyle) {
				return;
			}

			/*
						const techniquesOption = createElement('button', {
							innerText: technique.displayName,
							value: technique.key,
							parent: this.#htmlTechniques,
						}) as HTMLOptionElement;
						 */


			let htmlPlacementPrice: HTMLElement;
			const htmlPlacementButton = createElement('button', {
				childs: [
					createElement('span', {
						class: 'title-price',
						childs: [
							createElement('span', {
								class: 'title',
								i18n: {
									innerText: '#placement_with_size',
									values: {
										placement_name: placementStyle.displayName,
										placement_width: +placementStyle.printAreaWidth.toFixed(2),
										placement_height: +placementStyle.printAreaHeight.toFixed(2)
									}
								},
							}),
							htmlPlacementPrice = createElement('span', { class: 'price', }),
						],
					}),

					createElement('harmony-toggle-button', {
						state: '0',
						childs: [
							createElement('span', {
								slot: 'off',
								innerHTML: lockOpenRightSVG,
							}),
							createElement('span', {
								slot: 'on',
								innerHTML: lockSVG,
							}),
						],
						$change: (event: Event) => this.#lockPlacement(placement.getPlacement(), (event.target as HTMLHarmonyToggleButtonElement).state),
					}) as HTMLHarmonyToggleButtonElement,
				],
				value: placement.getPlacement(),
				parent: this.#htmlPlacements,
			}) as HTMLButtonElement;

			if (!firstPlacement) {
				firstPlacement = placement;
			}


			//this.#placementOptions.set(placementOption, placement);
			this.#placementsPrice.set(placement.getPlacement(), htmlPlacementPrice);
			this.#placementsButtons.set(placement.getPlacement(), htmlPlacementButton);
		}

		if (firstPlacement) {
			this.#htmlPlacements?.select(firstPlacement.getPlacement(), true);
			this.#selectPlacement(firstPlacement.getPlacement());
		}

		this.#refreshPlacementsPrice();
		this.#generateTemplates();
	}

	async #refreshPlacementsPrice() {
		const includedPlacements: Array<string> = this.#productPreset.getIncludedPlacements().map((p: PlacementPreset) => p.getPlacement());
		console.info(includedPlacements);

		const prices = await getPlacementsPrices(this.#productPreset.productId, this.#productPreset.getTechnique(), new Set(includedPlacements));
		console.info(prices);
		let totalPrice = 0;
		for (const [placement, button] of this.#placementsPrice) {
			const price = prices.get(placement);

			let value: string = '';
			if (price == 0) {
				//if (includedPlacements.length > 1)
				{
					value = I18n.getString('#placement_price_included');
					updateElement(button, {
						i18n: '#placement_price_included',
					});
					continue;
				}
			} else if (price !== undefined) {
				value = '+' + formatPrice(price/*TODO: add currency*/);
				totalPrice += price;
			}

			//I18n.setValue(button, 'placement_price', value);

			updateElement(button, {
				i18n: null,
				innerText: value,
			});
		}

		this.#htmlProductPrice!.innerText = await getProductPrice(this.#productPreset.productId);
		if (totalPrice > 0) {
			this.#htmlProductPrice!.innerText += ` +${formatPrice(totalPrice)}`;
		}

		this.#refreshPlacementsButton();
	}

	async #refreshPlacementsButton() {
		for (const [placement, button] of this.#placementsButtons) {
			button.disabled = await this.#productPreset.isConflictingPlacement(placement);;
		}
	}

	async #initProduct(productId: number) {

		//this.#htmlVariants!.replaceChildren();
		//this.#htmlVariants!.disabled = true;

		//if (getClientProductResponse.success) {
		let firstVariant: number | undefined;
		const product = await getProduct(productId);
		if (!product) {
			return;
		}
		//const jsonVariants = getClientProductResponse.result.variants
		const variants = await getProductVariants(productId);
		//this.#htmlVariants!.disabled = variants.length < 2;

		for (let variant of variants) {
			//this.#variants.set(variant.id, variant);
			//this.#addVariantOption(variant);
			if (firstVariant === undefined) {
				firstVariant = variant?.id as number;
			}
		}
		if (firstVariant !== undefined) {
			this.#selectVariant(firstVariant);
		}
		/*} else {
			//TODO
		}*/
	}

	async #addCategoryItem(category: Category) {
		const item: HarmonyMenuItem = { name: category.title, f: () => this.#selectCategory(category.id) };
		if (await categoryHasSubCategories(category.id)) {
			item.submenu = [];
		}

		this.#htmlCategoryMenuItems.set(category.id, item);
	}

	#addProductOption(product: any/*TODO: improve type*/) {
		if (!this.#productOptions.has(product.id)) {
			let htmlProductOption = createElement('option', {
				innerText: product.name,
				value: product.id,
				parent: this.#htmlProducts,

			}) as HTMLOptionElement;
			let htmlProduct = createElement('printful-product', {
				innerText: product.name,
				value: product.id,
				parent: this.#htmlProductsList,
				elementCreated: (element: Element) => {
					(element as PrintfulProductElement).setProduct(product);
				},
				$click: () => {
					this.#selectProduct(product.id);
					this.#displayTemplateTab();
				}
			}) as HTMLOptionElement;
			this.#htmlProducts!.disabled = this.#htmlProducts!.options.length < 2;
			this.#productOption.set(htmlProductOption, product);
			this.#productList.set(htmlProduct, product);
		}
	}

	#addVariantOption(variant: any/*TODO: improve type*/) {//Remove me
		/*
		if (this.#htmlVariantOptions.has(variant.id)) {
			this.#htmlVariants!.append(this.#htmlVariantOptions.get(variant.id)!);
			return;
		}

		let htmlProductOption = createElement('option', {
			innerText: variant.name,
			value: variant.id,
			parent: this.#htmlVariants,

		}) as HTMLOptionElement;

		this.#htmlVariantOptions.set(variant.id, htmlProductOption);
		*/
	}

	#applyProductFilter() {
		let firstProduct: number = -1;
		for (const [htmlOption, product] of this.#productOption) {
			const match = this.#matchFilter(product);
			display(htmlOption, match);
			if (firstProduct == -1 && match) {
				firstProduct = product.id as number;
			}
		}

		for (const [htmlProduct, product] of this.#productList) {
			const match = this.#matchFilter(product);
			display(htmlProduct, match);
		}

		/*
		if (firstProduct != -1) {
			this.#selectProduct(firstProduct);
		}
		*/
	}

	#matchFilter(product: Product): boolean {

		if (this.#productFilter.categoryId != 0 && !isParent(product, this.#productFilter.categoryId)) {
			return false;
		}

		return true
	}

	hide() {
		hide(this.getShadowRoot());
		//this.onClosed();
	}

	show() {
		show(this.getShadowRoot());
	}

	/*
	onClosed() {
		this.dispatchEvent(new CustomEvent('closed'));
	}
	*/

	#handlePropertyChanged(detail: EntityObserverPropertyChangedEvent) {
		return;
		/*
		if (this.#originalCamera && detail.entity == this.#originalCamera) {
			if (
				(!vec3.exactEquals(this.#originalCamera.position, this.#camera.position)) ||
				(!quat.exactEquals(this.#originalCamera.quaternion, this.#camera.quaternion))
			) {
				this.#refreshTemplate();
			}
		}
		*/
	}

	/*
	async #drawTemplate(
		sourceImage: HTMLImageElement,
		canvasWidth: number,
		canvasHeight: number,
		singleImageWidth: number,
		singleImageHeight: number,
		printFileCenter: vec2,
		printFileLeft: number,
		printFileTop: number,
		printFileWidth: number,
		printFileHeight: number,
		placementPreset: PlacementPreset,
		template: MockupTemplate,
		generatePrintFile: boolean

	): Promise<boolean> {
		/*
		if (!this.#renderTarget) {
			return false;
		}
		* /
		if (this.#dirtyBackground) {
			this.#htmlTemplateCanvasBackgroundCtx!.clearRect(0, 0, this.#htmlTemplateCanvas!.width, this.#htmlTemplateCanvas!.height);
		}
		if (this.#dirtyForeground) {
			this.#htmlTemplateCanvasForegroundCtx!.clearRect(0, 0, this.#htmlTemplateCanvas!.width, this.#htmlTemplateCanvas!.height);
		}

		const sampledImageWidth = singleImageWidth * overSample;
		const sampledImageHeight = singleImageHeight * overSample;
		//this.#renderTarget.resize(sampledImageWidth, sampledImageHeight);


		if (!generatePrintFile) {
			if (template.templatePositioning == Positioning.Background) {
				if (template.backgroundURL && this.#dirtyBackground) {
					await drawBackground(this.#htmlTemplateCanvasBackgroundCtx!, template.backgroundURL, canvasWidth, canvasHeight);
				}

				if (template.imageURL && this.#dirtyBackground) {
					await drawBackground(this.#htmlTemplateCanvasBackgroundCtx!, template.imageURL, canvasWidth, canvasHeight);
				}
			} else {
				//await drawForeground(template.imageURL, canvasWidth, canvasHeight);
				if (template.backgroundURL && this.#dirtyBackground) {
					await drawBackground(this.#htmlTemplateCanvasBackgroundCtx!, template.backgroundURL, canvasWidth, canvasHeight);
				}

				if (template.imageURL && this.#dirtyForeground) {
					await drawForeground(this.#htmlTemplateCanvasForegroundCtx!, template.imageURL, canvasWidth, canvasHeight);
				}
			}

			this.#dirtyBackground = false;
			this.#dirtyForeground = false;
			if (this.#htmlDrawGrid!.state) {
				await drawGrid(
					this.#htmlTemplateCanvasForegroundCtx!,
					template.templateWidth,
					template.templateHeight,
					printFileLeft,
					printFileTop,
					printFileWidth,
					printFileHeight,
				);
			}
		}
		if (loadoutImageBitmap) {
			await drawPattern(
				this.#htmlTemplateCanvasCtx!,
				sourceImage,
				printFileLeft,
				printFileTop,
				printFileWidth,
				printFileHeight,
				printFileCenter,
				singleImageWidth,
				singleImageHeight,
				this.#productPreset.getSelectedPreset().getHorizontalOffset(),
				this.#productPreset.getSelectedPreset().getVerticalOffset(),
				this.#productPreset.getSelectedPreset().getRotation(),
				this.#productPreset.getSelectedPreset().getHorizontalGap(),
				this.#productPreset.getSelectedPreset().getVerticalGap(),
				this.#productPreset.getSelectedPreset().getPattern(),
				this.#productPreset.getSelectedPreset().isTransparent(),
				clearColor,
			);
			//loadoutImageBitmap.close();
		}

		if (generatePrintFile) {
			//let printFileImage = new Image();
			//printFileImage.src = this.#htmlTemplateCanvas.toDataURL();
			if (loadoutImageBitmap) {
				await drawPattern(
					this.#offscreenCanvasCtx!,
					loadoutImageBitmap,
					printFileLeft,
					printFileTop,
					printFileWidth,
					printFileHeight,
					printFileCenter,
					singleImageWidth,
					singleImageHeight,
					this.#productPreset.getSelectedPreset().getHorizontalOffset(),
					this.#productPreset.getSelectedPreset().getVerticalOffset(),
					this.#productPreset.getSelectedPreset().getRotation(),
					this.#productPreset.getSelectedPreset().getHorizontalGap(),
					this.#productPreset.getSelectedPreset().getVerticalGap(),
					this.#productPreset.getSelectedPreset().getPattern(),
					this.#productPreset.getSelectedPreset().isTransparent(),
					clearColor,
				);
				return true;
			}
			//this.#htmlTemplateCanvas.toBlob(blob => SaveFile(new File([blob], 'test.png')));
			//this.#htmlTemplateCanvas.toBlob(async blob => this.testImage = await blob.text());
			//this.#testImage = this.#htmlTemplateCanvas!.toDataURL();
		}

		return false;
	}
*/
}

const imageCache = new Map<string, HTMLImageElement>();
async function getImage(src: string): Promise<HTMLImageElement> {
	let image: HTMLImageElement | undefined = imageCache.get(src);
	if (image) {
		await image.decode();
		return image;
	}

	image = new Image();
	image.src = src;
	imageCache.set(src, image);
	await image.decode();
	return image;
}

/**
 * Copy a bitmap into an image.
 *
 * @remarks
 * The ImageBitmap is not consumed.
 *
 * @param bitmap The input bitmap.
 * @param image The image to copy the bitmap into. If undefined, a new one is allocated .
 * @returns image
 */
export function imageBitmapToImage(bitmap: ImageBitmap, image = new Image()): HTMLImageElement {
	const canvas = createElement('canvas', { width: bitmap.width, height: bitmap.height }) as HTMLCanvasElement;
	const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
	/*
	canvas.width = bitmap.width;
	canvas.height = bitmap.height;
	*/
	ctx.drawImage(bitmap, 0, 0);

	image.src = canvas.toDataURL();
	return image;
}

/**
 * Draw a single image.
 *
 * @param context The context to draw into.
 * @param image The image to draw.
 * @param width The width to draw the image in the destination canvas.
 * @param height The height to draw the image in the destination canvas.
 * @param center The center of the destination canvas.
 * @param x Center offset along the x axis.
 * @param y Center offset along the y axis.
 * @param rotation Image rotation around center offset.
 * @param rotatedX Offset the image after rotation along the x axis.
 * @param rotatedY Offset the image after rotation along the x axis.
 */
function drawPicture(
	context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	image: ImageBitmap | HTMLImageElement,
	width: number,
	height: number,
	center: vec2,
	x: number,
	y: number,
	rotation: Radian,
	rotatedX: number,
	rotatedY: number
): void {
	context.save();
	context.translate(center[0] + x, center[1] + y);
	context.rotate(rotation);
	context.drawImage(image,
		rotatedX - width * 0.5,
		rotatedY - height * 0.5,
		width, height);
	context.restore();
}

async function drawPattern(
	context: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
	image: ImageBitmap | HTMLImageElement,
	left: number,
	top: number,
	width: number,
	height: number,
	center: vec2,
	singleImageWidth: number,
	singleImageHeight: number,
	horizontalOffset: number,
	verticalOffset: number,
	rotation: Radian,
	horizontalGap: number,
	verticalGap: number,
	pattern: Pattern,
	transparent: boolean,
	clearColor: vec4
): Promise<void> {
	if (transparent) {
		context.fillStyle = 'rgba(0, 0, 0, 0)';
	} else {
		context.fillStyle = `rgba(${clearColor[0] * 255}, ${clearColor[1] * 255}, ${clearColor[2] * 255}, 1)`;
	}
	context.fillRect(left, top, width, height);

	//await image.decode();
	let xCount = 2;
	let yCount = 2;

	xCount = Math.ceil(width / (singleImageWidth * (1 + horizontalGap)));
	yCount = Math.ceil(height / (singleImageHeight * (1 + verticalGap)));

	// Ensure there is always an odd count
	if (xCount % 2 == 0) {
		xCount += 1;
	}
	if (yCount % 2 == 0) {
		yCount += 1;
	}

	switch (pattern) {
		case Pattern.None:
			xCount = 1;
			yCount = 1;
			break;
		case Pattern.Horizontal:
			yCount = 1;
			break;
		case Pattern.Vertical:
			xCount = 1;
			break;
		default:
			break;
	}

	context.beginPath();
	context.rect(left, top, width, height);
	context.clip();

	for (let i = 0; i < xCount; i++) {
		let offsetY = 0;

		let x = i - (xCount - 1) * 0.5;
		if (pattern == Pattern.HalfDrop && (x % 2 != 0)) {
			offsetY = 0.5;
		}
		for (let j = 0; j < yCount + offsetY; j++) {
			let offsetX = 0;
			let y = j - (yCount - 1) * 0.5;
			if (pattern == Pattern.Brick && (y % 2 != 0)) {
				offsetX = 0.5;
			}

			/*
			drawPicture(image,
				this.#productPreset.getSelectedPreset().getHorizontalOffset(), (x - offsetX) * singleImageWidth * (1 + this.#productPreset.getSelectedPreset().getHorizontalGap()),
				this.#productPreset.getSelectedPreset().getVerticalOffset(), (y - offsetY) * singleImageHeight * (1 + this.#productPreset.getSelectedPreset().getVerticalGap()),
			);
			*/
			drawPicture(context,
				image, singleImageWidth, singleImageHeight, center,
				horizontalOffset * width,
				verticalOffset * height,
				rotation,
				(x - offsetX) * singleImageWidth * (1 + horizontalGap),
				(y - offsetY) * singleImageHeight * (1 + verticalGap),
			);

		}
	}
}

async function drawGrid(
	context: CanvasRenderingContext2D,
	templateWidth: number,
	templateHeight: number,
	left: number,
	top: number,
	width: number,
	height: number,
): Promise<void> {
	try {
		const maxDim = Math.max(templateWidth, templateHeight);

		const printFileRight = left + width;
		const printFileBottom = top + height;
		const printFileVerticalCenter = left + width * 0.5;
		const printFileHorizontalCenter = top + height * 0.5;
		context.setLineDash([maxDim / 200, maxDim / 200]);
		context.lineWidth = maxDim / 300;
		context.strokeStyle = "#4affff";
		context.beginPath();
		// draw border
		context.moveTo(left, top);
		context.lineTo(printFileRight, top);
		context.lineTo(printFileRight, printFileBottom);
		context.lineTo(left, printFileBottom);
		context.lineTo(left, top);
		context.stroke();

		context.lineWidth = maxDim / 600;

		// Draw vertical center
		context.moveTo(printFileVerticalCenter, top);
		context.lineTo(printFileVerticalCenter, printFileBottom);
		// Draw horizontal center
		context.moveTo(left, printFileHorizontalCenter);
		context.lineTo(printFileRight, printFileHorizontalCenter);
		context.stroke();
	} catch (e) { }
}

async function drawBackground(
	context: CanvasRenderingContext2D,
	imageUrl: string,
	width: number,
	height: number
): Promise<void> {
	try {
		const templateBackgroundImage = await getImage(imageUrl);
		context.drawImage(templateBackgroundImage, 0, 0, width, height);
	} catch (e) {
		console.error(e);
	}
}

async function drawForeground(
	context: CanvasRenderingContext2D,
	imageUrl: string,
	width: number,
	height: number
): Promise<void> {
	try {
		const templateForegroundImage = await getImage(imageUrl);
		context.drawImage(templateForegroundImage, 0, 0, width, height);
	} catch (e) {
		console.error(e);
	}
}
