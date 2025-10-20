import { Source1ModelInstance } from 'harmony-3d';
import { Effect } from '../effects/effect';
import { Team } from '../enums';
import { Item } from '../items/item';
import { addTF2Model } from '../scene';
import { Tf2Class } from './characters';

export class Character {
	readonly characterClass: Tf2Class;
	#model: Source1ModelInstance | null = null;
	#items = new Set<Item>();
	#effects = new Set<Effect>();
	#tauntEffect: Effect | null = null;
	#killstreakEffect: Effect | null = null;
	#team = Team.Red;
	#readyPromiseResolve!: (value: any) => void;
	#ready = new Promise<boolean>((resolve) => {
		this.#readyPromiseResolve = resolve;
	});
	#loaded = false;
	#visible? = false;

	constructor(characterClass: Tf2Class) {
		this.characterClass = characterClass;
	}

	async loadModel(name: string): Promise<void> {
		if (this.#loaded) {
			return;
		}
		this.#loaded = true;
		this.#model = await addTF2Model(name);
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

	async getModel() {
		await this.#ready;
		return this.#model;
	}
}
