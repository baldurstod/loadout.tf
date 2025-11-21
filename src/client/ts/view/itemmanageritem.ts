import { Source1TextureManager, TextureManager } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { createElement, defineHarmonySwitch, HarmonySwitchChange, hide, HTMLHarmonySwitchElement, isVisible, show } from 'harmony-ui';
import filterAllMotdPNG from '../../img/class_icon/filter_all_motd.png';
import filterDemoMotdPNG from '../../img/class_icon/filter_demo_motd.png';
import filterEngineerMotdPNG from '../../img/class_icon/filter_engineer_motd.png';
import filterHeavyMotdPNG from '../../img/class_icon/filter_heavy_motd.png';
import filterMedicMotdPNG from '../../img/class_icon/filter_medic_motd.png';
import filterPyroMotdPNG from '../../img/class_icon/filter_pyro_motd.png';
import filterScoutMotdPNG from '../../img/class_icon/filter_scout_motd.png';
import filterSniperMotdPNG from '../../img/class_icon/filter_sniper_motd.png';
import filterSoldierMotdPNG from '../../img/class_icon/filter_soldier_motd.png';
import filterSpyMotdPNG from '../../img/class_icon/filter_spy_motd.png';
import decalToolPNG from '../../img/items/decal_tool.png';
import festivizerPNG from '../../img/items/festivizer.png';
import mvmPowCritPNG from '../../img/items/mvm_pow_crit.png';
import paintcanPNG from '../../img/items/paintcan.png';
import paintkitBundle03PNG from '../../img/items/paintkit_bundle_03.png';
import viewmodeSpookyPNG from '../../img/items/viewmode_spooky.png';
import viewmodeUnusualVtfPNG from '../../img/items/viewmode_unusual.vtf.png';
import { inventoryPath, STEAM_PROFILE_URL } from '../constants';
import { Controller, ControllerEvent, ItemPinned } from '../controller';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { ItemTemplate } from '../loadout/items/itemtemplate';

const SELECTED_CLASS = 'item-manager-item-selected';
const WORKSHOP_URL = 'http://steamcommunity.com/sharedfiles/filedetails/?id=';
const CLASS_ICONS: Record<string, string> = {
	demoman: filterDemoMotdPNG,
	engineer: filterEngineerMotdPNG,
	heavy: filterHeavyMotdPNG,
	medic: filterMedicMotdPNG,
	pyro: filterPyroMotdPNG,
	scout: filterScoutMotdPNG,
	sniper: filterSniperMotdPNG,
	soldier: filterSoldierMotdPNG,
	spy: filterSpyMotdPNG,
	all: filterAllMotdPNG,
}

export class ItemManagerItem/*TODO: rename class*/ extends HTMLElement {
	#item?: ItemTemplate;
	#visible = false;
	#initialized = false;
	#detailInitialized = false;
	#detail?: HTMLElement;
	#it: any/*TODO: imrpove type*/;
	#itemNameDiv?: HTMLElement;
	#itemIconDiv?: HTMLImageElement;
	#detailTimeout?: ReturnType<typeof setTimeout>;
	#htmlPinned?: HTMLHarmonySwitchElement;

	connectedCallback(): void {
		const callback: IntersectionObserverCallback = (entries, observer) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					(entry.target as ItemManagerItem).visible = true;
					observer.unobserve(entry.target);
				}
			});
		};
		new IntersectionObserver(callback, { threshold: 0.5 }).observe(this);
	}

	set item(item: any/*TODO: improve type*/) {
		this.#item = item;
		if (item) {
			this.#refresh();
		}
	}

	set it(it: any/*TODO: improve type*/) {
		this.#it = it;
	}

	set visible(visible: boolean) {
		this.#visible = visible;
		if (visible) {
			this.#refresh();
		}
	}

	#refresh(): void {
		if (this.#item && this.#visible && !this.#initialized) {
			this.#createHTML();

			if (this.#item.isWorkshop()) {
				this.#itemNameDiv!.innerHTML = '<a target=\'_blank\' href=\'' + WORKSHOP_URL + this.#item.id.substring(1)/*Remove leading w*/ + '\' >' + this.#item.name + '</a>';
				this.#itemNameDiv!.classList.add('workshop-item');
			} else {
				this.#itemNameDiv!.innerHTML = this.#item.name;
			}

			const itemGrade = this.#item.getGrade();
			if (itemGrade) {
				this.classList.add('item-grade-' + itemGrade);
			}

			const imageInventory = this.#item.imageInventory;
			if (imageInventory) {
				if (imageInventory?.substring(0, 4) == 'http') {
					//this.#itemIconDiv!.style.backgroundImage = 'url(\'' + imageInventory + '\')';
					this.#itemIconDiv!.src = imageInventory;
				} else {
					//this.#itemIconDiv!.style.backgroundImage = 'url(\'' + inventoryPath + imageInventory.toLowerCase() + '.png\')';
					this.#itemIconDiv!.src = inventoryPath + imageInventory.toLowerCase() + '.png';
				}
			}
			this.#initialized = true;
		}
	}

	#showDetail(): void {
		if (OptionsManager.getItem('app.items.detail.display')) {
			clearTimeout(this.#detailTimeout);
			this.#detailTimeout = setTimeout(() => this.#showDetail2(), 500);
		}
	}

	#showDetail2(): void {
		if (this.#detail && isVisible(this.#detail)) {
			show(this.#detail);
		}
		if (this.#item && this.#visible && !this.#detailInitialized) {
			this.#detailInitialized = true;
			this.#detail = createElement('div', { class: 'detail' });
			this.append(this.#detail);
			this.#createDetail();
		}
		show(this.#detail);
		this.#detail!.style.left = '0px';
		//this.#detail.style.right = 'unset';
		const pinned = OptionsManager.getItem('app.items.pinned');
		const index = pinned.indexOf(this.#item!.id);
		this.#htmlPinned!.state = (index != -1);

		if (this.parentElement) {
			const detailRect = this.#detail!.getBoundingClientRect();
			const parentRect = this.parentElement.getBoundingClientRect();

			if (detailRect.right > parentRect.right) {
				this.#detail!.style.left = `${parentRect.right - detailRect.right - 20}px`;
				//this.#detail.style.left = 'unset';
			}
		}
	}


	#createDetail(): void {
		defineHarmonySwitch();
		const item = this.#item;
		if (!item) {
			return;
		}
		this.#detail!.addEventListener('click', event => { event.stopPropagation(); });
		const linkName = /*item.realname || */item.name;
		this.#detail!.innerText = '';

		const detailTitle = createElement('div', { class: 'item-manager-item-detail-title' });
		detailTitle.innerHTML = linkName;
		this.#detail!.append(detailTitle);

		const itemCollection = item.getCollection();
		if (itemCollection) {
			const detailCollection = createElement('div', { class: 'item-detail-collection' });
			detailCollection.innerText = itemCollection;
			this.#detail!.append(detailCollection);
		}

		if (item.isHalloweenRestricted()) {
			const detailHalloween = createElement('div', { class: 'item-detail-halloween capitalize', i18n: '#worn_halloween' });
			this.#detail!.append(detailHalloween);
		}

		const detailClasses = createElement('div', { class: 'item-detail-classes' });

		const usedByClasses = item.getUsedByClasses();
		if (usedByClasses.size == 9) {
			const detailAllClasses = createElement('img', {
				src: filterAllMotdPNG,
				class: 'item-manager-item-detail-class',
			});
			detailClasses.append(detailAllClasses);
		} else {
			for (const c of usedByClasses) {
				const detailClass = createElement('img', {
					src: CLASS_ICONS[c],
					class: 'item-manager-item-detail-class',
				});
				detailClasses.append(detailClass);
			}
		}
		this.#detail!.append(detailClasses);

		const itemGrade = item.getGrade();
		if (itemGrade) {
			this.#detail!.append(createElement('div', { class: 'item-detail-grade capitalize', i18n: '#item_grade_' + itemGrade }));
		}

		if (item.equipRegions) {
			const equipRegionHtml = createElement('div', { class: 'item-detail-equip-region capitalize' });
			equipRegionHtml.innerHTML = item.equipRegions.join(', ');
			this.#detail!.append(equipRegionHtml);
		}

		const itemSlot = item.getItemSlot();
		if (itemSlot) {
			const itemSlotHtml = createElement('div', { class: 'item-detail-item-slot capitalize' });
			itemSlotHtml.innerText = itemSlot;
			this.#detail!.append(itemSlotHtml);
		}

		if (item.isWorkshop()) {
			const detailWorkshopLink = createElement('a', { class: 'item-manager-item-detail-wiki-link capitalize', i18n: '#workshop' }) as HTMLAnchorElement;
			detailWorkshopLink.href = encodeURI(`${WORKSHOP_URL}${item.id}`);
			detailWorkshopLink.target = '_blank';
			this.#detail!.append(detailWorkshopLink);

			if (item.creatorid64) {
				const detailCreatorLink = createElement('a', { class: 'item-manager-item-detail-wiki-link capitalize', i18n: '#creator' }) as HTMLAnchorElement;
				detailCreatorLink.href = encodeURI(`${STEAM_PROFILE_URL}${item.creatorid64}`);
				detailCreatorLink.target = '_blank';
				this.#detail!.append(detailCreatorLink);
			}

		} else {
			const detailWikiLink = createElement('a', { class: 'item-manager-item-detail-wiki-link capitalize', i18n: '#official_wiki' }) as HTMLAnchorElement;
			detailWikiLink.href = encodeURI(`https://wiki.teamfortress.com/wiki/${linkName}`);
			detailWikiLink.target = '_blank';
			this.#detail!.append(detailWikiLink);

			const detailSteamLink = createElement('a', { class: 'item-manager-item-detail-steammarket-link capitalize', i18n: '#steam_market' }) as HTMLAnchorElement;
			detailSteamLink.href = `https://steamcommunity.com/market/search?appid=440&q=${linkName}`;
			detailSteamLink.target = '_blank';
			this.#detail!.append(detailSteamLink);
		}



		if (item.weaponUsesStattrakModule) {
			const divStattrak = createElement('input', {
				class: 'capitalize',
				i18n: { placeholder: '#stat_clock', },
				$keydown: (event: MouseEvent) => event.stopPropagation(),
			});
			this.#detail!.append(divStattrak);
			//divStattrak.itemName = item;
			divStattrak.addEventListener('input', event => {
				const i = CharacterManager.getCurrentCharacter()?.getItemById(item.id);
				if (i) {
					i.setKillCount(Number((event.target as HTMLInputElement).value));
				}
				event.stopPropagation();
			});
		}


		this.#htmlPinned = createElement('harmony-switch', {
			class: 'pin-switch',
			'data-i18n': '#pin_item',
			//$change: (event: CustomEvent<HarmonySwitchChange>) => Controller.dispatchEvent(new CustomEvent('itempinned', { detail: { id: this.#item.id, pinned: event.detail.state } })),
			$change: (event: CustomEvent<HarmonySwitchChange>) => {
				if (this.#item) {
					Controller.dispatchEvent<ItemPinned>(ControllerEvent.ItemPinned, { detail: { item: this.#item, pinned: event.detail.state! } })
				}
			},
		}) as HTMLHarmonySwitchElement;
		this.#detail!.append(this.#htmlPinned);
	}

	#hideDetail(): void {
		clearTimeout(this.#detailTimeout);
		if (this.#detail) {
			hide(this.#detail);
		}
	}

	#addWarpaintButton(): void {
		createElement('img', {
			class: 'warpaint-icon',
			parent: this,
			src: paintkitBundle03PNG,
			$click: (event: Event) => {
				Controller.dispatchEvent<ItemTemplate>(ControllerEvent.WarpaintClick, { detail: this.#item });
				event.stopPropagation();
			}
		});

		// unusual effect
		createElement('img', {
			class: 'unusual-icon',
			parent: this,
			src: viewmodeUnusualVtfPNG,
			$click: (event: Event) => {
				Controller.dispatchEvent<ItemTemplate>(ControllerEvent.WeaponEffectClick, { detail: this.#item });
				event.stopPropagation();
			}
		});
	}

	#createHTML(): void {
		this.setAttribute('title', this.#item!.name);
		this.addEventListener('mouseover', () => { this.#showDetail(); });
		this.addEventListener('mouseleave', () => { this.#hideDetail(); });
		this.#itemIconDiv = createElement('img', { class: 'item-image', parent: this, }) as HTMLImageElement;
		this.#itemNameDiv = createElement('div', { class: 'item-name', parent: this, });

		const itemTemplate = this.#item!;
		createElement('img', {
			class: `paint-icon ${itemTemplate.isPaintable() ? 'paintable' : 'non-paintable'}`,
			parent: this,
			src: paintcanPNG,
			$click: (event: Event) => {
				Controller.dispatchEvent<ItemTemplate>(ControllerEvent.PaintClick, { detail: this.#item });
				event.stopPropagation();
			},
		});

		if (itemTemplate.isWarPaintable()) {
			this.#addWarpaintButton();
		}

		if (itemTemplate.attachedModelsFestive) {
			createElement('img', {
				class: 'festivizer-icon',
				parent: this,
				src: festivizerPNG,
				i18n: {
					title: '#festivizer',
				},
				$click: (event: Event) => {
					const item = CharacterManager.getCurrentCharacter()?.getItemById(itemTemplate.id);
					if (item) {
						item.toggleFestivizer();
					}
					event.stopPropagation();
				},
			});
		}

		if (itemTemplate.canCustomizeTexture()) {
			function ProcessBackgroundImageUrlDrop(event: Event): void {
				event.preventDefault();
				let files: FileList | null = null;
				if (event.target) {
					files = (event.target as HTMLInputElement).files;
				}

				if (!files) {
					return;
				}

				for (let i = 0, f; f = files[i]; i++) {
					if (!f.type.match('image.*')) {
						continue;
					}

					const reader = new FileReader();

					// Closure to capture the file information.
					reader.onload = (() => {
						return (e): void => {
							const image = new Image();
							image.onload = (): void => {
								//let customTextureName = 'testCustomTexture2' + (this.customTextureId++);
								//it.setCustomTexture(customTextureName);

								const { name: textureName, texture: texture } = Source1TextureManager.addInternalTexture('tf2'/*TODO: get repository from item*/);
								TextureManager.fillTextureWithImage(texture.getFrame(0)!, image);
								//Source1TextureManager.addInternalTexture3(textureName, image);
								CharacterManager.setCustomTexture(itemTemplate.id, textureName);
							}
							image.src = (e.target as FileReader).result as string;
						};
					})();
					(event.target as HTMLInputElement).value = '';
					// Read in the image file as a data URL.
					reader.readAsDataURL(f);
				}
			}

			createElement('div', {
				class: 'decal-icon',
				parent: this,
				childs: [
					createElement('img', {
						src: decalToolPNG,
					}),
					createElement('input', {
						type: 'file',
						accept: 'image/*',
						$change: ProcessBackgroundImageUrlDrop,
						$click: (event: Event) => event.stopPropagation(),
						$keydown: (event: Event) => event.stopPropagation(),
					}),
				],
			});
		}

		const itemSlot = itemTemplate.getItemSlot();
		if (
			(itemSlot == 'melee')
			|| (itemSlot == 'primary')
			|| (itemSlot == 'secondary')
		) {
			createElement('img', {
				class: 'crit-icon',
				parent: this,
				src: mvmPowCritPNG,
				$click: (event: Event) => {
					const item = CharacterManager.getCurrentCharacter()?.getItemById(itemTemplate.id);
					if (item) {
						item.critBoost();
					}
					event.stopPropagation();
				},
			});
		}

		//const itemSlot = itemTemplate.item_slot;
		if (itemSlot && (itemSlot.indexOf('melee') != -1 || itemSlot.indexOf('pda') != -1 || itemSlot.indexOf('pda2') != -1 || itemSlot.indexOf('primary') != -1 || itemSlot.indexOf('secondary') != -1)) {
			createElement('img', {
				class: 'sheen-icon',
				parent: this,
				src: paintcanPNG,
				$click: (event: Event) => {
					Controller.dispatchEvent<ItemTemplate>(ControllerEvent.SheenClick, { detail: this.#item });
					event.stopPropagation();
				},
			});
		}

		if (itemTemplate.isHalloweenRestricted()) {
			const div2 = createElement('img', {
				class: 'spooky-icon',
				src: viewmodeSpookyPNG,
			});
			this.append(div2);
		}
	}

	set selected(selected: boolean) {
		if (selected) {
			this.classList.add(SELECTED_CLASS);
		} else {
			this.classList.remove(SELECTED_CLASS);
		}
	}

	setConflicting(conflicting: boolean): void {
		if (conflicting) {
			this.classList.add('conflicting');
		} else {
			this.classList.remove('conflicting');
		}
	}

	setInterfering(interfering: boolean): void {
		if (interfering) {
			this.classList.add('interfering');
		} else {
			this.classList.remove('interfering');
		}

	}
}
customElements.define('item-manager-item', ItemManagerItem);
