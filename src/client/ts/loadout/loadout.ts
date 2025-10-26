import { Source1ModelInstance } from 'harmony-3d';
import { TF2_CASUAL_BADGE } from '../constants';
import { Controller, ControllerEvent } from '../controller';
import { CharacterManager } from './characters/charactermanager';
import { Item } from './items/item';
import { ItemTemplate } from './items/itemtemplate';
import { addTF2Model } from './scene';

export class Loadout {
	static #badgeModel: Source1ModelInstance | null = null;
	static #items = new Map<string, Item>();

	static {
		this.#initListeners();
	}

	static #initListeners(): void {
		Controller.addEventListener(ControllerEvent.ItemClicked, (event: Event) => { this.#handleItemClicked((event as CustomEvent<ItemTemplate>).detail) });
	}

	static async showBadge(level: number, tier: number): Promise<void> {
		if (level) {
			if (!this.#badgeModel) {
				//this.#badgeModel.visible = false;
				this.#badgeModel = await addTF2Model(TF2_CASUAL_BADGE);
				if (this.#badgeModel) {
					this.#badgeModel.setQuaternion([0, 0, -1, 1]);
					this.#badgeModel.setPosition([0, 0, 40]);
				}
			} else {
				this.#badgeModel.setVisible(undefined);
			}

			if (this.#badgeModel) {
				this.#badgeModel.skin = String(Math.floor((level - 1) / 25) + (tier - 1) * 6);
				const stars = (level - 1) % 5 + 1;
				const bullets = Math.floor(((level - 1) % 25) / 5);
				const plates = Math.floor(((level - 1) % 25) / 5) - 1;
				const banner = ((level - 1) % 25) > 14;

				this.#badgeModel.setBodyPartModel('bullets', bullets);
				this.#badgeModel.setBodyPartModel('stars', stars);
				this.#badgeModel.setBodyPartModel('plates', plates);
				this.#badgeModel.setBodyPartModel('banner', banner ? 1 : 0);

				this.#badgeModel.renderBodyParts(true);
			}
		} else {
			if (this.#badgeModel) {
				this.#badgeModel.setVisible(false);
			}
		}
	}

	/*
	static async addItem(id: string, style = 0): Promise<Item | null> {
		const template = ItemManager.getTemplate(id);
		if (!template) {
			return null;
		}

		let item = this.#items.get(template.id);
		if (item) {
			return item;
		}

		item = new Item(template);
		this.#items.set(template.id, item);
		item.loadModel();

		loadoutScene.addChild(await item.getModel());

		return null;
	}

	static async removeItem(id: string, style = 0): Promise<void> {
		const item = this.#items.get(id);
		if (item) {
			await item.remove();
			this.#items.delete(id);
		}
	}

	static async toggleItem(id: string, style: number = 0): Promise<void> {
		if (this.#items.has(id)) {
			await this.removeItem(id);
		} else {
			await this.addItem(id);
		}
	}
		*/

	static async #handleItemClicked(template: ItemTemplate): Promise<void> {
		const currentCharacter = CharacterManager.getCurrentCharacter();

		if (currentCharacter) {
			const addedItem = await currentCharacter.toggleItem(template);
			const isAdded = addedItem[1];
			Controller.dispatchEvent<Item>(isAdded ? ControllerEvent.ItemAdded : ControllerEvent.ItemRemoved, { detail: addedItem[0] });
		}
	}
}
