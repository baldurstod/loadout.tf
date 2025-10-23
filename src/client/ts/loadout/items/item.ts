import { Source1ModelInstance } from 'harmony-3d';
import { Team } from '../enums';
import { ItemTemplate } from './itemtemplate';
import { Character } from '../characters/character';

export class Item {
	id = '';
	#itemTemplate: ItemTemplate;
	#character: Character;
	#model: Source1ModelInstance | null = null;
	#team = Team.Red;

	constructor(itemTemplate: ItemTemplate, character: Character) {
		this.#itemTemplate = itemTemplate;
		this.#character = character;
		/*
		this.#ready = new Promise((resolve, reject) => {
			this.#readyPromiseResolve = resolve;
		});
		*/
	}

	async setTeam(team: Team): Promise<void> {
		this.#team = team;
		// TODO
		//await this.#refreshSkin();
		//await this.#refreshSheen();
		//await this.#refreshPaint();
	}

	getEquipRegions(): string[] {
		return this.#itemTemplate.equipRegions;
	}
}
