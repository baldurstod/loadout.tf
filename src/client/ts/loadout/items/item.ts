import { Material, Source1MaterialManager, Source1ModelInstance } from 'harmony-3d';
import { MATERIAL_INVULN_BLU, MATERIAL_INVULN_RED } from '../../constants';
import { Paint } from '../../paints/paints';
import { colorToVec3 } from '../../utils/colors';
import { Character } from '../characters/character';
import { Team } from '../enums';
import { addTF2Model } from '../scene';
import { hasConflict } from './hasconflict';
import { ItemTemplate } from './itemtemplate';

export class Item {
	readonly id: string;
	#itemTemplate: ItemTemplate;
	#character?: Character;
	#model: Source1ModelInstance | null = null;
	#modelBlu?: Source1ModelInstance | null;
	#extraWearable?: Source1ModelInstance | null;
	#attachedModels: Source1ModelInstance[] = [];
	#festivizerModel?: Source1ModelInstance | null;
	#stattrakModule?: Source1ModelInstance | null;
	#team = Team.Red;
	#killCount?: number;
	#refreshingSkin = false;
	#showFestivizer = false;
	#critBoost = false;
	#loaded = false;
	#paint: Paint | null = null;
	#readyPromiseResolve!: (value: any) => void;
	#ready = new Promise<boolean>((resolve) => {
		this.#readyPromiseResolve = resolve;
	});

	constructor(itemTemplate: ItemTemplate, character?: Character) {
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
		this.#team = team;
		// TODO
		await this.#refreshSkin();
		//await this.#refreshSheen();
		//await this.#refreshPaint();
	}

	getEquipRegions(): string[] {
		return this.#itemTemplate.equipRegions;
	}

	async toggleStattrak(count: number): Promise<void> {
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
			this.#stattrakModule.setVisible(count == 0 ? false : undefined);
			const stattrakScale = Number.parseFloat(this.#itemTemplate.weaponStattrakModuleScale ?? 1);
			this.#stattrakModule.materialsParams['StatTrakNumber'] = count;
			const stattrackBone = this.#model?.getBoneByName('c_weapon_stattrack');
			if (stattrackBone) {
				stattrackBone.scale = [stattrakScale, stattrakScale, stattrakScale];
			}
		}
	}

	async #refreshSkin(): Promise<void> {
		// TODO
		if (this.#refreshingSkin) {
			return;
		}
		this.#refreshingSkin = true;

		const skin = this.#team ? this.#itemTemplate.bluSkin : this.#itemTemplate.redSkin;
		/*
		// TODO
		if (this.#critBoostSysRed) {
			this.#critBoostSysRed.stop();
			this.#critBoostSysRed.remove();
			this.#critBoostSysRed = null;
		}

		if (this.#critBoostSysBlu) {
			this.#critBoostSysBlu.stop();
			this.#critBoostSysBlu.remove();
			this.#critBoostSysBlu = null;
		}*/

		if (this.#model) {
			await this.#ready;

			if (this.#character?.isInvulnerable()) {
				const materialName = this.#team ? MATERIAL_INVULN_BLU : MATERIAL_INVULN_RED;
				//await setTimeoutPromise(1000);// Ensure this is done after the material are set. This is lame but it works
				this.#setMaterialOverride(materialName);
			} else {
				this.#setMaterialOverride();
				await this.#model.setSkin(String(skin));
				/*
				TODO
				if (this.paintKitId != undefined) {
					WeaponManager.refreshPaint(this);
				}
				*/
			}


			// TODO
			//this.setBurnLevel(this.#character.burnLevel);

			const sourceModelBlu = this.#modelBlu;
			if (sourceModelBlu) {
				if (this.#team == Team.Red) {
					this.#model.setVisible(undefined);
					sourceModelBlu.setVisible(false);
				} else {
					this.#model.setVisible(false);
					sourceModelBlu.setVisible(undefined);
				}
			}

			/*

			// TODO
			if (this.#critBoost) {
				let systemName = '';
				let glowColor = null;
				let sys = null;
				if (this.#team == 0) {
					sys = this.#critBoostSysRed;
					glowColor = [80, 8, 5];
					systemName = 'critgun_weaponmodel_red';
				} else {
					sys = this.#critBoostSysBlu;
					glowColor = [5, 20, 80]
					systemName = 'critgun_weaponmodel_blu';
				}
				//systemName = 'unusual_mystery_parent';
				if (systemName && glowColor) {
					if (!sys) {
						sys = await Source1ParticleControler.createSystem('tf2', systemName);
					}
					sys.start();
					this.#sourceModel.addChild(sys);
					this.#sourceModel.attachSystem(sys, '');
					this.#sourceModel.materialsParams['ModelGlowColor'] = glowColor;
					if (this.#stattrakModule) {
						this.#stattrakModule.materialsParams['ModelGlowColor'] = glowColor;
					}
				}
				if (this.team == 0) {
					this.#critBoostSysRed = sys;
				} else {
					this.#critBoostSysBlu = sys;
				}

			} else {
				this.#model.materialsParams['ModelGlowColor'] = null;
				if (this.#stattrakModule) {
					this.#stattrakModule.materialsParams['ModelGlowColor'] = null;
				}
			}
			*/
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

		const extraWearable = this.#extraWearable
		await extraWearable?.setSkin(String(skin));
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

	async loadModel(): Promise<void> {
		if (this.#loaded) {
			return;
		}
		this.#loaded = true;
		const path = this.#itemTemplate.getModel('scout');
		if (path) {
			this.#model = await addTF2Model(path, this.getRepository());
		}

		if (this.#model) {
			this.#readyPromiseResolve(true);
			this.#model.setFlexes();
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

	async remove(): Promise<void> {
		await this.#ready;
		this.#model?.remove();
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

	async #setMaterialOverride(materialOverride?: string): Promise<void> {
		let material: Material | null = null;
		if (materialOverride) {
			material = await Source1MaterialManager.getMaterial('tf2', materialOverride);
		}

		void this.#model?.setMaterialOverride(material);

		void this.#extraWearable?.setMaterialOverride(material);
		for (const extraModel of this.#attachedModels) {
			void extraModel.setMaterialOverride(material);
		}

		void this.#festivizerModel?.setMaterialOverride(material);

		void this.#stattrakModule?.setMaterialOverride(material);
	}
}
