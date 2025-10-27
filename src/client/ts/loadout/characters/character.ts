import { Source1ModelInstance } from 'harmony-3d';
import { Effect } from '../effects/effect';
import { Team } from '../enums';
import { Item } from '../items/item';
import { ItemTemplate } from '../items/itemtemplate';
import { addTF2Model } from '../scene';
import { CharactersList, ClassRemovablePartsOff, Tf2Class } from './characters';

export class Character {
	readonly characterClass: Tf2Class;
	readonly name: string;
	readonly items = new Map<string, Item>();
	#showBodyParts = new Map<string, boolean>();
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
			this.#loadoutChanged();
			return [existingItem, false];
		} else {
			const item = new Item(template, this);
			this.items.set(template.id, item);
			item.loadModel();
			(await this.getModel())?.addChild(await item.getModel());
			await item.setTeam(this.#team);
			this.#loadoutChanged();
			return [item, true];
		}
	}

	updatePaintColor(): void {
		for (const [, item] of this.items) {
			item.updatePaintColor();
		}
	}

	isInvulnerable(): boolean {
		return this.#isInvulnerable;
	}

	#loadoutChanged() {
		// TODO
		//this.#autoSelectAnim();
		//this.#processSoul();
		this.#checkBodyGroups();
		//Controller.dispatchEvent(new CustomEvent('loadout-changed', { detail: { character: this } }));
	}

	async #checkBodyGroups() {
		await this.#ready;

		let bodyGroupList;
		let item;
		let bodyGroupIndex: string;
		let bodyGroup;
		this.#renderBodyParts(true);
		this.#model?.setVisible(this.#visible);
		this.#model?.resetBodyPartModels();

		for (let bodyGroupIndex = 0; bodyGroupIndex < ClassRemovablePartsOff.length; bodyGroupIndex++) {
			this.renderBodyPart(ClassRemovablePartsOff[bodyGroupIndex]!, false);
		}

		for (let [itemId, item] of this.items) {
			let playerBodygroups = item.getTemplate().playerBodygroups;
			if (playerBodygroups) {
				for (bodyGroupIndex in playerBodygroups) {
					bodyGroup = playerBodygroups[bodyGroupIndex];
					this.setBodyPartModel(bodyGroupIndex, Number(bodyGroup));
				}
			}

			let wmBodygroupOverride = item.getTemplate().wmBodygroupOverride;
			if (wmBodygroupOverride) {
				for (bodyGroupIndex in wmBodygroupOverride) {
					bodyGroup = wmBodygroupOverride[bodyGroupIndex];
					this.setBodyPartIdModel(Number(bodyGroupIndex), Number(bodyGroup));
				}
			}
		}
	}

	renderBodyPart(bodyPart: string, render: boolean) {
		this.#showBodyParts.set(bodyPart, render);
		this.#model?.renderBodyPart(bodyPart, render);
	}

	#renderBodyParts(render: boolean): void {
		this.#model?.renderBodyParts(render);
	}

	setBodyPartIdModel(bodyPartId: number, modelId: number): void {
		this.#model?.setBodyPartIdModel(bodyPartId, modelId);
	}

	setBodyPartModel(bodyPartId: string, modelId: number): void {
		this.#model?.setBodyPartModel(bodyPartId, modelId);
	}
}
