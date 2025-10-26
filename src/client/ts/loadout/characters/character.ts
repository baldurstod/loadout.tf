import { Source1ModelInstance } from 'harmony-3d';
import { Effect } from '../effects/effect';
import { Team } from '../enums';
import { Item } from '../items/item';
import { ItemTemplate } from '../items/itemtemplate';
import { addTF2Model } from '../scene';
import { CharactersList, Tf2Class } from './characters';

export class Character {
	readonly characterClass: Tf2Class;
	readonly name: string;
	readonly items = new Map<string, Item>();
	#model: Source1ModelInstance | null = null;
	#effects = new Set<Effect>();
	#tauntEffect: Effect | null = null;
	#killstreakEffect: Effect | null = null;
	#team = Team.Red;
	#readyPromiseResolve!: (value: any) => void;
	#ready = new Promise<boolean>((resolve) => {
		this.#readyPromiseResolve = resolve;
	});
	#loaded = false;
	#visible = true;
	#zombieSkin = false;
	#isInvulnerable = false;

	constructor(characterClass: Tf2Class) {
		this.characterClass = characterClass;
		this.name = CharactersList.get(characterClass)?.name ?? '';
	}

	async loadModel(path: string, name: string): Promise<void> {
		if (this.#loaded) {
			return;
		}
		this.#loaded = true;
		this.#model = await addTF2Model(path);
		if (!this.#model) {
			this.#readyPromiseResolve(false);
			return;
		}
		this.#readyPromiseResolve(true);
		this.#model.setFlexes();
		this.#model.setPoseParameter('move_x', 1);
		this.#model.setPoseParameter('move_y', 0.5);
		this.#model.setPoseParameter('body_yaw', 0.5);
		this.#model.setPoseParameter('body_pitch', 0.3);
		this.#model.setPoseParameter('r_arm', 0);
		this.#model.setPoseParameter('r_hand_grip', 0);
		this.#model.name = name;
		this.#model.setVisible(this.#visible);
		//modelLayer.addEntity(this.characterModel);
	}

	async getModel(): Promise<Source1ModelInstance | null> {
		await this.#ready;
		return this.#model;
	}

	setVisible(visble: boolean): void {
		this.#visible = visble;
		this.#model?.setVisible(visble);
	}

	async setTeam(team: Team): Promise<void> {
		this.#team = team;

		for (const [, item] of this.items) {
			await item.setTeam(team);
		}
		await this.#refreshSkin();

		await this.#ready;
		if (this.#model) {
			this.#model.materialsParams.team = this.#team;
		}
	}

	async #refreshSkin(): Promise<void> {
		await this.#ready;
		if (this.#model) {
			const zombieSkinOffset = (this.characterClass == Tf2Class.Spy ? 22 : 4);
			await this.#model.setSkin(String(this.#team + (this.#zombieSkin ? zombieSkinOffset : 0) + (this.#isInvulnerable ? 2 : 0)));
		}
	}

	getTeam(): Team {
		return this.#team;
	}

	getItemById(itemId: string): Item | undefined {
		return this.items.get(itemId);
	}

	async toggleItem(template: ItemTemplate): Promise<[Item, boolean]> {
		const existingItem = this.items.get(template.id);

		if (existingItem) {
			existingItem.remove();
			this.items.delete(template.id);
			return [existingItem, false];
		} else {
			const item = new Item(template, this);
			this.items.set(template.id, item);
			item.loadModel();
			(await this.getModel())?.addChild(await item.getModel());
			return [item, true];
		}
	}

	updatePaintColor(): void {
		for (let [, item] of this.items) {
			item.updatePaintColor();
		}
	}
}
