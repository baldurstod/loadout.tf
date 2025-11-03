import { Source1ModelInstance } from 'harmony-3d';
import { TF2_CASUAL_BADGE } from '../constants';
import { Controller, ControllerEvent, KillstreakClicked } from '../controller';
import { KillstreakColor } from '../paints/killstreaks';
import { CharacterManager } from './characters/charactermanager';
import { Effect } from './effects/effect';
import { EffectTemplate } from './effects/effecttemplate';
import { Item } from './items/item';
import { ItemTemplate } from './items/itemtemplate';
import { addTF2Model } from './scene';
import { Tf2Class } from './characters/characters';

export class Loadout {
	static #badgeModel: Source1ModelInstance | null = null;
	static #items = new Map<string, Item>();

	static {
		this.#initListeners();
	}

	static #initListeners(): void {
		Controller.addEventListener(ControllerEvent.ItemClicked, (event: Event) => { this.#handleItemClicked((event as CustomEvent<ItemTemplate>).detail) });
		Controller.addEventListener(ControllerEvent.EffectClicked, (event: Event) => { this.#handleEffectClicked((event as CustomEvent<EffectTemplate>).detail) });
		Controller.addEventListener(ControllerEvent.KillstreakClicked, (event: Event) => { this.#handleKillstreakClicked((event as CustomEvent<KillstreakClicked>).detail.effect, (event as CustomEvent<KillstreakClicked>).detail.color) });
		Controller.addEventListener(ControllerEvent.SetDecapitationLevel, (event: Event) => { this.#handleSetDecapitationEffect((event as CustomEvent<number>).detail) });
		Controller.addEventListener(ControllerEvent.TauntEffectClicked, (event: Event) => { this.#handleTauntEffectClicked((event as CustomEvent<EffectTemplate | null>).detail) });
		Controller.addEventListener(ControllerEvent.RemoveEffect, (event: Event) => this.#handleRemoveEffect((event as CustomEvent<Effect>).detail),);
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

		if (currentCharacter && currentCharacter.characterClass != Tf2Class.None) {
			await currentCharacter.toggleItem(template);
		}
	}

	static async #handleEffectClicked(template: EffectTemplate): Promise<void> {
		const currentCharacter = CharacterManager.getCurrentCharacter();

		if (currentCharacter) {
			const addedEffect = await currentCharacter?.addEffect(template);
			Controller.dispatchEvent<Effect>(ControllerEvent.EffectAdded, { detail: addedEffect });
		}
	}

	static #handleRemoveEffect(effect: Effect): void {
		const currentCharacter = CharacterManager.getCurrentCharacter();

		if (currentCharacter) {
			currentCharacter?.removeEffect(effect);
			Controller.dispatchEvent<Effect>(ControllerEvent.EffectRemoved, { detail: effect });
		}
	}

	static async #handleKillstreakClicked(effect: EffectTemplate | null, color: KillstreakColor): Promise<void> {
		const currentCharacter = CharacterManager.getCurrentCharacter();

		if (currentCharacter) {
			const addedEffects = await currentCharacter?.setKillsteakEffect(effect, color);

			for (const addedEffect of addedEffects) {
				if (addedEffect) {
					Controller.dispatchEvent<Effect>(ControllerEvent.EffectAdded, { detail: addedEffect });
				}
			}
		}
	}

	static async #handleSetDecapitationEffect(level: number): Promise<void> {
		const currentCharacter = CharacterManager.getCurrentCharacter();

		if (currentCharacter) {
			const addedEffects = await currentCharacter?.setDecapitationLevel(level);

			for (const addedEffect of addedEffects) {
				if (addedEffect) {
					Controller.dispatchEvent<Effect>(ControllerEvent.EffectAdded, { detail: addedEffect });
				}
			}
		}
	}

	static async #handleTauntEffectClicked(template: EffectTemplate | null): Promise<void> {
		const currentCharacter = CharacterManager.getCurrentCharacter();

		if (currentCharacter) {
			const addedEffect = await currentCharacter?.setTauntEffect(template);
			if (addedEffect) {
				Controller.dispatchEvent<Effect>(ControllerEvent.EffectAdded, { detail: addedEffect });
			}
		}
	}
}
