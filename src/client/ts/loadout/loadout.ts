import { Source1ModelInstance } from 'harmony-3d';
import { TF2_CASUAL_BADGE } from '../constants';
import { addTF2Model } from './scene';

export class Loadout {
	static #badgeModel: Source1ModelInstance | null = null;

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
				let stars = (level - 1) % 5 + 1;
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
}
