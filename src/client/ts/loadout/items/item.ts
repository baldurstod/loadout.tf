import { vec3 } from 'gl-matrix';
import { Material, Source1MaterialManager, Source1ModelInstance, Source1ParticleControler, Source1ParticleSystem } from 'harmony-3d';
import { WeaponManager } from 'harmony-3d-utils';
import { MATERIAL_GOLD_RAGDOLL, MATERIAL_ICE_RAGDOLL, MATERIAL_INVULN_BLU, MATERIAL_INVULN_RED } from '../../constants';
import { Killstreak } from '../../paints/killstreaks';
import { Paint } from '../../paints/paints';
import { colorToVec3 } from '../../utils/colors';
import { randomProperty } from '../../utils/randomproperty';
import { Character, Ragdoll } from '../characters/character';
import { weaponEffects } from '../effects/effect';
import { Team } from '../enums';
import { addTF2Model } from '../scene';
import { hasConflict } from './hasconflict';
import { ItemTemplate } from './itemtemplate';

export class Item {
	readonly id: string;
	#itemTemplate: ItemTemplate;
	#character: Character;
	#model: Source1ModelInstance | null = null;
	#modelBlu: Source1ModelInstance | null = null;
	#modelExtraWearable: Source1ModelInstance | null = null;
	#attachedModels: Source1ModelInstance[] = [];
	#festivizerModel?: Source1ModelInstance | null;
	#stattrakModule?: Source1ModelInstance | null;
	#team = Team.Red;
	#killCount: number | null = null;
	#refreshingSkin = false;
	#showFestivizer = false;
	#critBoost = false;
	#critBoostSysRed?: Source1ParticleSystem | null;
	#critBoostSysBlu?: Source1ParticleSystem | null;
	#weaponEffectSystem?: Source1ParticleSystem | null;
	#loaded = false;
	#paint: Paint | null = null;
	#sheen: Killstreak | null = null;
	#weaponEffectId: number | null = null;
	#paintKitWear = 0;
	#paintKitId: number | null = null;
	#paintKitSeed = 0n;
	#materialOverride: string | null = null;

	#readyPromiseResolve!: (value: any) => void;
	#ready = new Promise<boolean>((resolve) => {
		this.#readyPromiseResolve = resolve;
	});

	constructor(itemTemplate: ItemTemplate, character: Character) {
		this.#itemTemplate = itemTemplate;
		this.#character = character;
		this.id = itemTemplate.id;
		/*
		this.#ready = new Promise((resolve, reject) => {
			this.#readyPromiseResolve = resolve;
		});
		*/
	}

	getTemplate(): ItemTemplate {
		return this.#itemTemplate;
	}

	async setTeam(team: Team): Promise<void> {
		if (this.#team != team) {
			this.#team = team;
			await this.#refreshSkin();
			await this.#refreshSheen();
			this.#refreshWarPaint();
		}
	}

	getEquipRegions(): string[] {
		return this.#itemTemplate.equipRegions;
	}

	async toggleStattrak(count: number | null): Promise<void> {
		this.#killCount = count;
		if (!this.#stattrakModule) {
			const stattrakPath = this.#itemTemplate.weaponUsesStattrakModule;
			if (stattrakPath) {
				this.#stattrakModule = await addTF2Model(stattrakPath, undefined, 'Stat clock');
				//modelLayer.addEntity(this.#stattrakModule);
				if (this.#stattrakModule) {
					this.#model?.addChild(this.#stattrakModule);
					this.#refreshSkin();
				}
			}
		}
		if (this.#stattrakModule) {
			this.#stattrakModule.setVisible(count == null ? false : undefined);
			const stattrakScale = Number.parseFloat(this.#itemTemplate.weaponStattrakModuleScale ?? 1);
			this.#stattrakModule.materialsParams['StatTrakNumber'] = count;
			const stattrackBone = this.#model?.getBoneByName('c_weapon_stattrack');
			if (stattrackBone) {
				stattrackBone.scale = [stattrakScale, stattrakScale, stattrakScale];
			}
		}
	}

	getKillCount(): number | null {
		return this.#killCount;
	}

	async #refreshSkin(): Promise<void> {
		// TODO
		if (this.#refreshingSkin) {
			return;
		}
		this.#refreshingSkin = true;

		const skin = this.#team ? this.#itemTemplate.bluSkin : this.#itemTemplate.redSkin;

		if (this.#critBoostSysRed) {
			this.#critBoostSysRed.stop();
			this.#critBoostSysRed.remove();
			this.#critBoostSysRed = null;
		}

		if (this.#critBoostSysBlu) {
			this.#critBoostSysBlu.stop();
			this.#critBoostSysBlu.remove();
			this.#critBoostSysBlu = null;
		}

		await this.#ready;

		if (this.#character?.isInvulnerable() || this.#character?.getRagdoll() !== Ragdoll.None) {
			let materialName: string | null = null;
			switch (this.#character?.getRagdoll()) {
				case Ragdoll.None:
					materialName = this.#team ? MATERIAL_INVULN_BLU : MATERIAL_INVULN_RED;
					break;
				case Ragdoll.Gold:
					materialName = MATERIAL_GOLD_RAGDOLL;
					break;
				case Ragdoll.Ice:
					materialName = MATERIAL_ICE_RAGDOLL;
					break;
			}

			this.#setMaterialOverride(materialName);
		} else {
			this.#setMaterialOverride(null);

			const materialOverride = this.#itemTemplate.getMaterialOverride();
			if (materialOverride) {
				this.#setMaterialOverride(materialOverride);
			} else {
				await this.#model?.setSkin(String(skin));
			}

			if (this.#paintKitId !== null) {
				WeaponManager.refreshPaint(this);
			}
		}


		// TODO
		//this.setBurnLevel(this.#character.burnLevel);

		const sourceModelBlu = this.#modelBlu;
		if (sourceModelBlu) {
			if (this.#team == Team.Red) {
				this.#model?.setVisible(undefined);
				sourceModelBlu.setVisible(false);
			} else {
				this.#model?.setVisible(false);
				sourceModelBlu.setVisible(undefined);
			}
		}

		if (this.#model && this.#critBoost) {
			let systemName = '';
			let glowColor = null;
			let sys = null;
			if (this.#team == Team.Red) {
				sys = this.#critBoostSysRed;
				glowColor = [80, 8, 5];
				systemName = 'critgun_weaponmodel_red';
			} else {
				sys = this.#critBoostSysBlu;
				glowColor = [5, 20, 80]
				systemName = 'critgun_weaponmodel_blu';
			}

			if (systemName && glowColor) {
				if (!sys) {
					sys = await Source1ParticleControler.createSystem('tf2', systemName);
				}
				sys.start();
				this.#model.addChild(sys);
				this.#model.attachSystem(sys, '');
				this.#model.materialsParams['ModelGlowColor'] = glowColor;
				if (this.#stattrakModule) {
					this.#stattrakModule.materialsParams['ModelGlowColor'] = glowColor;
				}
			}
			if (this.#team == Team.Red) {
				this.#critBoostSysRed = sys;
			} else {
				this.#critBoostSysBlu = sys;
			}

		} else {
			if (this.#model) {
				this.#model.materialsParams['ModelGlowColor'] = null;
			}
			if (this.#stattrakModule) {
				this.#stattrakModule.materialsParams['ModelGlowColor'] = null;
			}
		}


		/*

			// TODO
		if (this.#character.isInvulnerable) {
			let materialName = this.#team ? MATERIAL_INVULN_BLU : MATERIAL_INVULN_RED;
			this.#setMaterialOverride(materialName);
		} else {
			this.#setMaterialOverride();

			const materialOverride = this.#itemTemplate.materialOverride;
			if (materialOverride) {
				//TODO: fix this
				await setTimeoutPromise(1000);// Ensure this is done after the material are set. This is lame but it works
				this.#setMaterialOverride(materialOverride);
			}
		}
		*/

		await this.#modelExtraWearable?.setSkin(String(skin));
		for (const extraModel of this.#attachedModels) {
			await extraModel.setSkin(String(skin));
		}

		await this.#festivizerModel?.setSkin(String(this.#team));
		await this.#stattrakModule?.setSkin(String(skin % 2));

		this.#refreshingSkin = false;
	}

	getRepository(): string {
		return this.#itemTemplate.repository ?? 'tf2';
	}

	async setShowFestivizer(showFestivizer: boolean): Promise<void> {
		this.#showFestivizer = showFestivizer;

		if (showFestivizer && !this.#festivizerModel) {
			const festivizerPath = this.#itemTemplate.attachedModelsFestive;
			if (festivizerPath) {
				this.#festivizerModel = await addTF2Model(festivizerPath, this.getRepository(), this.#itemTemplate.name + ' Festivizer');
				if (this.#festivizerModel) {
					this.#model?.addChild(this.#festivizerModel);
					this.#refreshSkin();
				}
			}
		}

		this.#festivizerModel?.setVisible(showFestivizer ? undefined : false);
	}

	getShowFestivizer(): boolean {
		return this.#showFestivizer;
	}

	async toggleFestivizer(): Promise<void> {
		await this.setShowFestivizer(!this.#showFestivizer);
	}

	setCustomTexture(textureName: string): void {
		if (this.#model) {
			this.#model.materialsParams.customtexture = textureName;
		}
	}

	critBoost(): void {
		this.#critBoost = !this.#critBoost;
		this.#refreshSkin();
	}

	async loadModel(npc: string): Promise<void> {
		if (this.#loaded) {
			return;
		}
		this.#loaded = true;
		const path = await this.#itemTemplate.getModel(npc);
		if (path) {
			this.#model = await addTF2Model(path, this.getRepository());
		}

		const pathBlu = this.#itemTemplate.getModelBlue(npc);
		if (pathBlu) {
			this.#modelBlu = await addTF2Model(pathBlu, this.getRepository());
			this.#modelBlu?.setVisible(false);
		}

		const attachedModels = this.#itemTemplate.getAttachedModels();
		if (attachedModels) {
			const attachedModel = attachedModels;
			//for (const attachedModel of attachedModels)
			{
				const extraModel = await addTF2Model(attachedModel, this.getRepository()/*, this.name + ' attached'*/);
				if (extraModel) {
					this.#model?.addChild(extraModel);
					this.#attachedModels.push(extraModel);
				}
			}
		}

		const pathExtraWearable = this.#itemTemplate.getExtraWearable();
		if (pathExtraWearable) {
			this.#modelExtraWearable = await addTF2Model(pathExtraWearable, this.getRepository());
		}

		if (this.#model) {
			this.#readyPromiseResolve(true);
			//this.#model.setFlexes();
			this.#model.setPoseParameter('move_x', 1);
			this.#model.setPoseParameter('move_y', 0.5);
			this.#model.setPoseParameter('body_yaw', 0.5);
			this.#model.setPoseParameter('body_pitch', 0.3);
			this.#model.setPoseParameter('r_arm', 0);
			this.#model.setPoseParameter('r_hand_grip', 0);
			this.#model.name = this.#itemTemplate.name;
		} else {
			this.#readyPromiseResolve(false);
		}
		//this.#model.setVisible(this.#visible);

		/*
		if (this.#character) {
			(await this.#character.getModel())?.addChild(this.#model);
		} else {
			loadoutScene.addChild(this.#model);
		}
		*/
	}

	async getModel(): Promise<Source1ModelInstance | null> {
		await this.#ready;
		return this.#model;
	}

	async getModelBlu(): Promise<Source1ModelInstance | null> {
		await this.#ready;
		return this.#modelBlu;
	}

	async getModelExtraWearable(): Promise<Source1ModelInstance | null> {
		await this.#ready;
		return this.#modelExtraWearable;
	}

	async remove(): Promise<void> {
		await this.#ready;
		this.#model?.remove();
		this.#modelBlu?.remove();
		this.#modelExtraWearable?.remove();
		for (const extraModel of this.#attachedModels) {
			extraModel.remove();
		}
	}

	isConflicting(other: Item): boolean {
		return hasConflict(this.getEquipRegions(), other.getEquipRegions());
	}

	setPaint(paint: Paint | null): void {
		this.#paint = paint;
		if (this.#model) {
			if (paint == null) {
				this.#model.tint = null;
				if (this.#team == Team.Red) {
					if (this.#itemTemplate.setItemTintRGB) {
						this.#model.tint = colorToVec3(Number(this.#itemTemplate.setItemTintRGB));
					}
				} else {
					if (this.#itemTemplate.setItemTintRGB2) {
						this.#model.tint = colorToVec3(Number(this.#itemTemplate.setItemTintRGB2));
					}
				}
			} else {
				this.#refreshPaint();
			}
		}
	}

	getPaint(): Paint | null {
		return this.#paint;
	}

	async #refreshPaint(): Promise<void> {
		await this.#ready;
		if (this.#model) {
			//this.#sourceModel.tint = null;
			if (this.#paint != null) {
				this.#model.tint = this.#paint.getTint(this.#team);
				/*
				if (paint && this.#paintId != DEFAULT_PAINT_ID) {
				}
				*/
			}
		}
	}

	updatePaintColor(): void {
		this.#refreshPaint();
	}

	async #setMaterialOverride(materialOverride: string | null): Promise<void> {
		let material: Material | null = null;
		this.#materialOverride = materialOverride;
		if (materialOverride) {
			material = await Source1MaterialManager.getMaterial('tf2', materialOverride);
		}

		void this.#model?.setMaterialOverride(material);
		void this.#modelBlu?.setMaterialOverride(material);

		void this.#modelExtraWearable?.setMaterialOverride(material);
		for (const extraModel of this.#attachedModels) {
			void extraModel.setMaterialOverride(material);
		}

		void this.#festivizerModel?.setMaterialOverride(material);

		void this.#stattrakModule?.setMaterialOverride(material);
	}

	setSheen(sheen: Killstreak | null): void {
		this.#sheen = sheen;
		if (this.#model) {
			if (sheen == null) {
				//this.#model.sheen = null;
			} else {
				this.#refreshSheen();
			}
		} else {
			// TODO: character sheen
		}
	}

	getSheen(): Killstreak | null {
		return this.#sheen;
	}

	async #refreshSheen(): Promise<void> {
		await this.#ready;
		const sheen = this.#sheen;
		if (sheen && this.#model) {
			this.#model.sheen = sheen.getSheenColor(this.#team);
		}
	}

	isTaunt(): boolean {
		return this.#itemTemplate.isTaunt();
	}

	getCustomTauntScenePerClass(npc: string): string | null {
		const customTauntScenePerClass = this.#itemTemplate.customTauntScenePerClass;
		if (!customTauntScenePerClass) {
			return null;
		}
		const scene = customTauntScenePerClass[npc];
		if (scene) {
			if (typeof scene == 'object') {
				return randomProperty(scene);
			}
			return scene;
		}
		return null;
	}

	getCustomTauntPropScenePerClass(npc: string): string | null {
		const customTauntPropScenePerClass = this.#itemTemplate.customTauntPropScenePerClass;
		if (!customTauntPropScenePerClass) {
			return null;
		}
		const scene = customTauntPropScenePerClass[npc];
		if (scene) {
			if (typeof scene == 'object') {
				return randomProperty(scene)
			}
			return scene;
		}
		return null;
	}

	getCustomTauntOutroScenePerClass(npc: string): string | null {
		const customTauntOutroScenePerClass = this.#itemTemplate.customTauntOutroScenePerClass;
		return customTauntOutroScenePerClass?.[npc] ?? null;
	}

	getCustomTauntPropOutroScenePerClass(npc: string): string | null {
		const customTauntPropOutroScenePerClass = this.#itemTemplate.customTauntPropOutroScenePerClass;
		return customTauntPropOutroScenePerClass?.[npc] ?? null;
	}

	getTauntAttackName(): string | null {
		return this.#itemTemplate.tauntAttackName;
	}

	setWeaponEffectId(weaponEffectId: number | null): void {
		this.#weaponEffectId = weaponEffectId;

		if (this.#weaponEffectSystem) {
			this.#weaponEffectSystem.stop();
			this.#weaponEffectSystem.remove();
			this.#weaponEffectSystem = null;
		}

		if (weaponEffectId == null) {
			return;
		}

		const weaponEffect = weaponEffects.get(weaponEffectId);
		const particleSuffix = this.getTemplate().particleSuffix;
		if (particleSuffix && weaponEffect) {
			//item.weaponEffects = item.weaponEffects || {};

			(async (): Promise<void> => {
				const particleSystem1 = await Source1ParticleControler.createSystem('tf2', 'weapon_unusual_' + weaponEffect[0] + '_' + particleSuffix);
				//particleSystem1.visible = true;

				const model = this.#model;
				if (particleSystem1 && model) {
					model.attachSystem(particleSystem1, 'unusual_1', 1, vec3.create());
					model.attachSystem(particleSystem1, 'unusual_2', 2);
					model.attachSystem(particleSystem1, 'unusual_3', 3);
					model.attachSystem(particleSystem1, 'unusual_4', 4);
					model.attachSystem(particleSystem1, 'unusual_5', 5);
					model.attachSystem(particleSystem1, 'unusual_0');
				}
				if (particleSystem1) {
					particleSystem1.start();
					this.#weaponEffectSystem = particleSystem1;
					//item.weaponEffects[weaponEffect] = particleSystem1;
				}
			})();
		}
	}

	getWeaponEffectId(): number | null {
		return this.#weaponEffectId;
	}

	setPaintKitId(paintKitId: number | null): void {
		if (this.#paintKitId != paintKitId) {
			this.#paintKitId = paintKitId;
			this.#refreshWarPaint();
		}
	}

	get paintKitId(): number | null {
		return this.#paintKitId ?? null;
	}

	setPaintKitWear(paintKitWear: number): void {
		if (this.#paintKitWear != paintKitWear) {
			this.#paintKitWear = paintKitWear;
			this.#refreshWarPaint();
		}
	}

	getPaintKitWear(): number {
		return this.#paintKitWear;
	}

	setPaintKitSeed(paintKitSeed: bigint): void {
		if (this.#paintKitSeed != paintKitSeed) {
			this.#paintKitSeed = paintKitSeed;
			this.#refreshWarPaint();
		}
	}

	getPaintKitSeed(): bigint {
		return this.#paintKitSeed;
	}

	setPaintKit(paintKitId: number, paintKitWear: number, paintKitSeed: bigint): void {
		if (this.#paintKitId != paintKitId || this.#paintKitWear != paintKitWear || this.#paintKitSeed != paintKitSeed) {

			this.#paintKitId = paintKitId;
			this.#paintKitWear = paintKitWear;
			this.#paintKitSeed = paintKitSeed;
			this.#refreshWarPaint();
		}
	}

	#refreshWarPaint(): void {
		if (this.#model && this.#paintKitId !== null && this.#materialOverride === null) {
			WeaponManager.refreshItem({
				id: this.id,
				paintKitId: this.#paintKitId,
				paintKitWear: this.#paintKitWear,
				paintKitSeed: this.#paintKitSeed,
				model: this.#model,
				team: this.#team,
			});
		}
	}

	getCharacter(): Character {
		return this.#character;
	}
}
