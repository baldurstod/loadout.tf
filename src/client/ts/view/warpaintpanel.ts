import { customFetch } from 'harmony-3d';
import { TextureCombiner, WeaponManager } from 'harmony-3d-utils';
import { OptionsManager, ShortcutHandler } from 'harmony-browser-utils';
import { JSONObject } from 'harmony-types';
import { createElement, hide, HTMLHarmonyFileInputElement, show } from 'harmony-ui';
import warpaintPanelCSS from '../../css/warpaintpanel.css';
import { STEAM_ECONOMY_IMAGE_PREFIX, TF2_WARPAINT_PICTURES_URL } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { Item } from '../loadout/items/item';
import { DynamicPanel } from './dynamicpanel';
import { WarpaintDefinitions } from 'harmony-tf2-utils';

type Warpaint = {
	warpaint: {
		descToken: string
	},
	html: HTMLElement,
}

export class WarpaintPanel extends DynamicPanel {
	#htmlWarpaints?: HTMLElement;
	readonly #currentItems = new Set<Item>();
	#htmlItemIcon?: HTMLElement;
	#paintsDivHeaderWearSelect?: HTMLSelectElement;
	#paintsDivHeaderFilterInput?: HTMLInputElement;
	#paintsDivHeaderFilterTeamOnly?: HTMLInputElement;
	#htmlPaintSeed?: HTMLInputElement;
	#warpaints = new Map<string, Warpaint>();
	#filter: { name: string, teamColoredOnly: boolean } = { name: '', teamColoredOnly: false };
	#warpaintPicsPromise?: Promise<JSONObject>;

	constructor() {
		super(Panel.Warpaints, [warpaintPanelCSS]);
		hide(this.getShadowRoot());
		Controller.addEventListener(ControllerEvent.SelectWarpaints, (event: Event): void => { this.selectWarpaint((event as CustomEvent<Item[]>).detail); });
		Controller.addEventListener(ControllerEvent.WarpaintsLoaded, (): void => { this.#fillWarpaints(); });
	}

	protected override initHTML(): void {
		this.#createWarpaintsView();
		/*
		for (const [id, [name, title]] of weaponEffects) {
			this.#createWarpaint(id, name, title);
		}
		*/
	}

	#createWarpaintsView(): void {
		createElement('div', {
			class: 'warpaints-inner',
			parent: this.getShadowRoot(),
			childs: [
				createElement('div', {
					childs: [
						createElement('label', { i18n: '#wear' }),
						this.#paintsDivHeaderWearSelect = createElement('select', {
							value: '0',
							$input: (event: Event) => this.#handleWearChangeClick(Number((event.target as HTMLSelectElement).value)),
						}) as HTMLSelectElement,
					],
				}),
				createElement('div', {
					childs: [
						createElement('label', { i18n: '#filter', }),
						this.#paintsDivHeaderFilterInput = createElement('input', {
							$input: (event: Event) => {
								OptionsManager.setItem('app.items.warpaints.filter.text', (event.target as HTMLInputElement).value);
								this.#filter.name = (event.target as HTMLInputElement).value.toLowerCase();
								this.#refreshWarpaintFilter();
							},
							//$keydown: (event: Event) => event.stopPropagation(),
						}) as HTMLInputElement,
					],
				}),
				createElement('div', {
					childs: [
						createElement('label', {
							childs: [
								createElement('span', { i18n: '#seed', }),
								this.#htmlPaintSeed = createElement('input', {
									$change: (event: Event) => this.#setWarpaintSeed(BigInt((event.target as HTMLInputElement).value)),
								}) as HTMLInputElement,
							],
						}),
					],
				}),
				createElement('div', {
					childs: [
						createElement('label', {
							childs: [
								createElement('span', { i18n: '#team_colored_only', }),
								this.#paintsDivHeaderFilterTeamOnly = createElement('input', {
									type: 'checkbox',
									$change: (event: Event) => {
										this.#filter.teamColoredOnly = (event.target as HTMLInputElement).checked;
										this.#refreshWarpaintFilter();
									},
								}) as HTMLInputElement,
							],
						}),
					],
				}),
				createElement('harmony-file-input', {
					'data-i18n': '#import_warpaint_definition',
					'data-accept': '.json',
					$change: (event: Event) => {
						//Controller.dispatchEvent<File[]>(ControllerEvent.ImportFiles, { detail: [...((event.target as HTMLHarmonyFileInputElement).files ?? [])] })
						const file = (event.target as HTMLHarmonyFileInputElement).files?.[0];
						if (!file || !file.type.match('application/json')) {
							return;
						}
						const reader = new FileReader();

						reader.addEventListener('load', () => {
							(async (): Promise<void> => {
								WarpaintDefinitions.setWarpaintDefinitions(JSON.parse(reader.result as string));
								await WeaponManager.refreshWarpaintDefinitions();
								this.#fillWarpaints();
							})();
						});

						reader.readAsText(file);
					},
				}),

				createElement('div', {
					childs: [],
				}),

				this.#htmlWarpaints = createElement('div', {
					class: 'warpaints',
					attributes: {
						tabindex: '1',
					},
				}),
			],
			$click: (event: Event) => event.stopPropagation(),
		});


		const wearLevels = ['#factory_new', '#minimal_wear', '#field_tested', '#well_worn', '#battle_scarred'];
		for (let i = 0; i < wearLevels.length; i++) {
			createElement('option', {
				parent: this.#paintsDivHeaderWearSelect,
				i18n: wearLevels[i],
				value: String(i),
			});
		}
		ShortcutHandler.addContext('loadout', this.#htmlWarpaints);

		this.getHTMLElement().addEventListener('click', (event: Event) => { this.hide(); event.stopPropagation(); });
	}
	/*
	#createWarpaint(id: number, name: string, title: string): void {
		const effectOption = createElement('img', {
			class: 'effect',
			src: `../../img/unusuals/weapon_unusual_${name}.png`,
			innerText: title,
			$click: (): void => {
				this.#currentItem?.setWeaponEffectId(id);
			}
		});

		effectOption.innerText = ' ';
		this.#htmlWarpaints!.appendChild(effectOption);
	}
	*/

	selectWarpaint(items: Item[]): void {
		this.getHTMLElement();
		this.#currentItems.clear()
		for (const item of items) {
			this.#currentItems.add(item);
		}

		this.#fillWarpaints();
		show(this.getHTMLElement());
	}

	#handleWearChangeClick(wear: number): void {
		for (const item of this.#currentItems) {
			item.setWarpaintWear(wear);
		}
	}

	#handleWarpaintClick(warpaintId: number): void {
		if (!this.#currentItems) {
			return;
		}
		let seed = 0n;
		try {
			seed = BigInt(this.#htmlPaintSeed?.value ?? 0);
		} catch (e) {
			console.warn('Can\'t convert seed to bigint', e);
		}

		for (const item of this.#currentItems) {
			item.setWarpaint(warpaintId, Number(this.#paintsDivHeaderWearSelect?.selectedOptions[0]?.getAttribute('data-value')), seed);
		}
	}

	#refreshWarpaintFilter(): void {
		for (const [, warpaint] of this.#warpaints) {
			const node = warpaint.html;//nodeList[i];
			const name = warpaint.warpaint.descToken.toLowerCase();
			if (name.includes(this.#filter.name)) {
				if (this.#paintsDivHeaderFilterTeamOnly?.checked) {
					if (node.getAttribute('hasTeamTextures')) {
						show(node);
					} else {
						hide(node);
					}
				} else {
					show(node);
				}
			} else {
				hide(node);
			}
		}
	}

	async #fillWarpaints(): Promise<void> {
		if (!this.#currentItems.size) {
			return;
		}

		const warpaintPics = await this.#getWarpaintPics();

		const firstItem = this.#currentItems.values().next().value!;
		const warpaints = firstItem.getTemplate().warpaints;
		this.#htmlWarpaints?.replaceChildren();
		//let nodeList = [];

		this.#warpaints.clear();
		//let textureCombiner = WeaponManager.textureCombiner;
		for (const [warpaintId, warpaint] of warpaints) {
			const weaponName = warpaint.weapon;
			const warpaintName = warpaint.title;
			let warpaintImage: HTMLImageElement;
			const d = createElement('div', {
				class: 'warpaint',
				parent: this.#htmlWarpaints,
				'data-warpaint-name': warpaintName.toLowerCase(),
				warpaintWeaponId: firstItem.id,
				warpaintWeaponName: weaponName,
				//weapon: weapon,
				child: warpaintImage = createElement('img', {
					class: 'warpaint-img',
					'data-warpaint-url': warpaintPics[warpaintName],
				}) as HTMLImageElement,
				$click: (event: Event) => { this.#handleWarpaintClick(Number(warpaintId)); event.stopPropagation(); },
			});

			const callback: IntersectionObserverCallback = (entries, observer) => {
				entries.forEach(entry => {
					if (entry.isIntersecting) {
						const img = (entry.target as HTMLImageElement);
						img.src = STEAM_ECONOMY_IMAGE_PREFIX + entry.target.getAttribute('data-warpaint-url');
						observer.unobserve(img);
					}
				});
			};
			new IntersectionObserver(callback).observe(warpaintImage);

			createElement('span', {
				class: 'warpaint-name',
				innerText: warpaintName,
				parent: d
			});

			this.#warpaints.set(warpaintId, { warpaint: { descToken: warpaint.title }, html: d });

			const warpaintDefinition = await TextureCombiner._getDefindex({ type: 9, defindex: warpaintId });
			if (warpaintDefinition.hasTeamTextures ?? warpaintDefinition.has_team_textures) {
				d.setAttribute('hasTeamTextures', '1');
			}

		}
		show(this.getHTMLElement());
		this.#refreshWarpaintFilter();
		this.#sortWarpaints();
		this.#paintsDivHeaderFilterInput?.focus();
	}

	async #getWarpaintPics(): Promise<JSONObject> {
		if (!this.#warpaintPicsPromise) {

			this.#warpaintPicsPromise = new Promise<JSONObject>((resolve): void => {
				(async (): Promise<void> => {
					const response = await customFetch(TF2_WARPAINT_PICTURES_URL);
					const json = await response.json();
					if (!json || !json.success) {
						resolve({});
						return;
					}
					resolve(json.result);
				})()
			});
		}
		return this.#warpaintPicsPromise;
	}

	#sortWarpaints(): void {
		for (const [, warpaint] of this.#warpaints) {
			this.#htmlWarpaints?.append(warpaint.html);
		}
	}

	hide(): void {
		hide(this.getHTMLElement());
	}

	#setWarpaintSeed(seed: bigint): void {
		for (const item of this.#currentItems) {
			item.setWarpaintSeed(seed);
		}
	}
}
