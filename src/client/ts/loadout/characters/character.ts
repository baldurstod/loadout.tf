import { vec3 } from 'gl-matrix';
import { ChoreographiesManager, ChoreographyEventType, RandomFloat, Source1ModelInstance, Source1ParticleControler, Source1ParticleSystem, Source1SoundManager } from 'harmony-3d';
import { OptionsManager } from 'harmony-browser-utils';
import { ENTITY_FLYING_BIRD_SPEED_MAX, ENTITY_FLYING_BIRD_SPEED_MIN, MEDIC_RELEASE_DOVE_COUNT } from '../../constants';
import { Effect } from '../effects/effect';
import { Team } from '../enums';
import { Item } from '../items/item';
import { ItemTemplate } from '../items/itemtemplate';
import { addTF2Model } from '../scene';
import { CharactersList, ClassRemovablePartsOff, Tf2Class } from './characters';
import { FlyingBird } from './flyingbird';
import { EffectTemplate, EffectType } from '../items/effecttemplate';

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
	#userAnim = '';
	#voicePose?: string;
	#taunt: Item | null = null;
	#flexControllers = new Map<string, number>;

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
		this.#model.resetFlexParameters();
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
			this.#removeItem(existingItem);
			return [existingItem, false];
		} else {
			return [await this.#addItem(template), true];
		}
	}

	async #removeItem(item: Item): Promise<void> {
		this.items.delete(item.id);
		if (item == this.#taunt) {
			this.#taunt = null;
			// TODO: play end choreo
			const npc = CharactersList.get(this.characterClass)!.name

			const choreoName = item.getCustomTauntOutroScenePerClass(npc);
			if (choreoName && this.#model) {
				await this.#ready;
				new ChoreographiesManager().stopAll();
				await new ChoreographiesManager().init('tf2', './scenes/scenes.image');
				const choreo = await new ChoreographiesManager().playChoreography(choreoName, [this.#model]);
				if (choreo) {
					choreo.addEventListener(ChoreographyEventType.Stop, () => {
						item.remove();
						this.#autoSelectAnim();
					});
				} else {
					item.remove();
				}

				const choreoName2 = item.getCustomTauntPropOutroScenePerClass(npc);
				const itemModel = await item.getModel();
				if (choreoName2 && itemModel) {
					await new ChoreographiesManager().init('tf2', './scenes/scenes.image');
					new ChoreographiesManager().playChoreography(choreoName2, [itemModel]);
				}
			} else {
				item.remove();
			}
		} else {
			item.remove();
		}
		this.#loadoutChanged();
	}

	async #addItem(template: ItemTemplate): Promise<Item> {
		const item = new Item(template, this);
		this.items.set(template.id, item);
		const npc = CharactersList.get(this.characterClass)!.name
		item.loadModel(npc);
		(await this.getModel())?.addChild(await item.getModel());
		await item.setTeam(this.#team);

		if (item.isTaunt()) {
			if (this.#taunt) {
				this.#taunt.remove();
				this.items.delete(this.#taunt.id);
			}

			this.#taunt = item;

			// Play choreo
			const choreoName = item.getCustomTauntScenePerClass(npc);
			if (this.#model && choreoName && template.getItemSlot() == 'taunt') {
				new ChoreographiesManager().stopAll();
				await new ChoreographiesManager().init('tf2', './scenes/scenes.image');
				new ChoreographiesManager().playChoreography(choreoName, [this.#model]);
			}

			const choreoName2 = item.getCustomTauntPropScenePerClass(npc);
			const itemModel = await item.getModel();
			if (choreoName2 && itemModel) {
				void itemModel.skeleton?.setParentSkeleton(null);
				await new ChoreographiesManager().init('tf2', './scenes/scenes.image');
				new ChoreographiesManager().playChoreography(choreoName2, [itemModel]);
			}
		}

		this.#doTauntAttack(item.getTauntAttackName());

		this.#loadoutChanged();
		return item;
	}

	updatePaintColor(): void {
		for (const [, item] of this.items) {
			item.updatePaintColor();
		}
	}

	isInvulnerable(): boolean {
		return this.#isInvulnerable;
	}

	async setInvulnerable(isInvulnerable: boolean): Promise<void> {
		this.#isInvulnerable = isInvulnerable;
		const promises: Promise<void>[] = [];
		promises.push(this.#refreshSkin());
		this.items.forEach(item => promises.push(item.setTeam(this.#team)));
		await Promise.all(promises);
	}

	#loadoutChanged(): void {
		this.#autoSelectAnim();
		this.#processSoul();
		this.#checkBodyGroups();
		//Controller.dispatchEvent(new CustomEvent('loadout-changed', { detail: { character: this } }));
	}

	async #checkBodyGroups(): Promise<void> {
		await this.#ready;

		let bodyGroupIndex: string;
		let bodyGroup;
		this.#renderBodyParts(true);
		this.#model?.setVisible(this.#visible);
		this.#model?.resetBodyPartModels();

		for (const classRemovableParts of ClassRemovablePartsOff) {
			this.renderBodyPart(classRemovableParts, false);
		}

		for (const [, item] of this.items) {
			const playerBodygroups = item.getTemplate().playerBodygroups;
			if (playerBodygroups) {
				for (bodyGroupIndex in playerBodygroups) {
					bodyGroup = playerBodygroups[bodyGroupIndex];
					this.setBodyPartModel(bodyGroupIndex, Number(bodyGroup));
				}
			}

			const wmBodygroupOverride = item.getTemplate().wmBodygroupOverride;
			if (wmBodygroupOverride) {
				for (bodyGroupIndex in wmBodygroupOverride) {
					bodyGroup = wmBodygroupOverride[bodyGroupIndex];
					this.setBodyPartIdModel(Number(bodyGroupIndex), Number(bodyGroup));
				}
			}
		}
	}

	renderBodyPart(bodyPart: string, render: boolean): void {
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

	setPose(pose: string): void {
		this.#voicePose = pose;
		this.#autoSelectAnim();
	}

	setUserAnim(userAnim: string): void {
		this.#userAnim = userAnim;
		if (userAnim) {
			this.#playAnim(userAnim);
		} else {
			this.#autoSelectAnim();
		}
	}

	async #playAnim(animName: string): Promise<void> {
		await this.#ready;

		this.#model?.playSequence(animName);
		await this.#model?.setAnimation(0, animName, 1);
	}

	#autoSelectAnim(): void {
		if (this.#userAnim) {
			return;
		}
		const pose = this.#voicePose ?? 'stand';
		if (OptionsManager.getItem('app.character.autoselectanim')) {
			this.#playAnim(pose + '_secondary');
		}
		for (const [, item] of this.items) {
			const animSlot = item.getTemplate().animSlot;
			const itemSlot = item.getTemplate().getItemSlotPerClass(CharactersList.get(this.characterClass)?.name ?? 'scout'/*TODO: fix* scout*/);
			if (itemSlot != 'action' && animSlot && animSlot.toLowerCase() != 'building') {
				if (animSlot[0] == '#') {
					//this.playAnim(animSlot.substring(1) + currentCharacter.npc.toLowerCase());
				} else if (animSlot[0] == '!') {
					this.#playAnim(animSlot.substring(1));
				} else if (animSlot.toLowerCase() == 'primary2') {
					this.#playAnim(pose + '_primary');
				} else if (animSlot.toLowerCase() != 'force_not_used') {
					this.#playAnim(pose + '_' + animSlot);
				}
			} else {
				let slot;
				switch (itemSlot) {
					case 'primary':
					case 'secondary':
					case 'melee':
					case 'pda':
						slot = itemSlot;
						break;
					case 'building':
						slot = 'sapper';
						break;
					case 'force_building':
						slot = 'building';
						break;
				}

				/*if (item.used_by_classes) {
					for (let c in item.used_by_classes) {
						if (c == currentCharacter.npc.toLowerCase()
							&& isNaN(item.used_by_classes[c])) {
							slot = item.used_by_classes[c];
							break;
						}
					}
				}*/
				if (slot) {
					this.#playAnim(pose + '_' + slot);
				}

			}
		}
	}

	#processSoul(): void {
		this.#zombieSkin = false;
		for (const [, item] of this.items) {
			if (item.getTemplate().name.includes('Voodoo-Cursed')) {
				this.#zombieSkin = true;
			}
		}
		this.#refreshSkin();
	}

	#doTauntAttack(tauntAttackName: string | null): void {
		const spawnClientsideFlyingBird = async (pos: vec3): Promise<void> => {
			const flyAngle = RandomFloat(-Math.PI, Math.PI);
			const flyAngleRate = RandomFloat(-1.5, 1.5);
			const accelZ = RandomFloat(0.5, 2.0);
			const speed = RandomFloat(ENTITY_FLYING_BIRD_SPEED_MIN, ENTITY_FLYING_BIRD_SPEED_MAX);
			const glideTime = RandomFloat(0.25, 1.);

			await this.#ready;
			new FlyingBird(this.#model, pos, flyAngle, flyAngleRate, accelZ, speed, glideTime);
		}

		switch (tauntAttackName) {
			case 'TAUNTATK_ALLCLASS_GUITAR_RIFF':
				//setEffect(this, 'bl_killtaunt', 'bl_killtaunt', 'no_attachment');
				this.#addEffect('bl_killtaunt', 'bl_killtaunt');
				Source1SoundManager.playSound('tf2', 'Taunt.GuitarRiff');
				break;
			case 'TAUNTATK_MEDIC_HEROIC_TAUNT':
				//setEffect(this, 'god_rays', 'god_rays', 'no_attachment');
				this.#addEffect('god_rays', 'god_rays');
				Source1SoundManager.playSound('tf2', 'Taunt.MedicHeroic');
				setTimeout((): void => {
					(async (): Promise<void> => {
						await this.#ready;
						if (!this.#model) {
							return;
						}
						const launchSpot = this.#model.getWorldPosition();
						for (let i = 0; i < MEDIC_RELEASE_DOVE_COUNT; ++i) {
							const pos = vec3.clone(launchSpot);
							pos[2] = pos[2] + Math.random() * 30 - 10 + 50;
							spawnClientsideFlyingBird(pos);
						}
					})()
				}, 3000);

				break;
		}
	}

	async #addEffect(name: string, systemName: string, attachment?: string, offset?: vec3): Promise<Effect> {
		const effect = new Effect();
		this.#effects.add(effect);

		//const system = await Source1ParticleControler.createSystem('tf2', systemName);
		effect.system = await Source1ParticleControler.createSystem('tf2', systemName);
		effect.system.name = name;

		await this.#ready;
		this.#model?.attachSystem(effect.system, attachment, 0, offset);
		effect.system.start();

		return effect;
	}

	async #attachSystem(system: Source1ParticleSystem, attachmentName: string, attachmentType?: any, offset?: vec3): Promise<void> {
		await this.#ready;
		this.#model?.attachSystem(system, attachmentName, 0, offset);
	}

	async setFlexControllerValue(name: string, value: number): Promise<void> {
		this.#flexControllers.set(name, value);
		await this.#updateFlexes();
	}

	async resetFlexes(): Promise<void> {
		this.#flexControllers.clear();
		await this.#updateFlexes();
	}

	async #updateFlexes(): Promise<void> {
		await this.#ready;
		this.#model?.setFlexes(this.#flexControllers);
		for (const [, item] of this.items) {
			(await item.getModel())?.setFlexes(this.#flexControllers);
		}
	}

	async addEffect(template: EffectTemplate): Promise<Effect> {
		const effect = new Effect();
		this.#effects.add(effect);

		//const system = await Source1ParticleControler.createSystem('tf2', systemName);
		effect.system = await Source1ParticleControler.createSystem('tf2', template.getSystem());
		effect.system.name = template.getName();

		await this.#ready;
		let attachment = '';
		switch (template.getType()) {
			case EffectType.Cosmetic:
				attachment = 'bip_head';
				break;
			default:
				break;
		}

		this.#model?.attachSystem(effect.system, attachment, 0);// TODO: offset
		effect.system.start();

		return effect;
	}
}
