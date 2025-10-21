import { Source1ModelInstance } from 'harmony-3d';
import { Team } from '../enums';

export class Item {
	#model: Source1ModelInstance | null = null;
	#team = Team.Red;

	async setTeam(team: Team): Promise<void> {
		this.#team = team;
		// TODO
		//await this.#refreshSkin();
		//await this.#refreshSheen();
		//await this.#refreshPaint();
	}
}
