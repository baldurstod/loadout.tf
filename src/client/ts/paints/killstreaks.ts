import { vec3 } from 'gl-matrix';
import killstreaks from '../../json/killstreak.json';
import { Team } from '../loadout/enums';

export enum KillstreakColor {
	None = 0,

	TeamShine = 1,
	DeadlyDaffodil = 2,
	Manndarin = 3,
	MeanGreen = 4,
	AgonizingEmerald = 5,
	VillainousViolet = 6,
	Hotrod = 7,

	Custom = 1000,
}

export type KillstreakDefinition = {
	name: string,
	sheen: KillstreakColor,
	teamColored: boolean,
	sheenRed: number,
	sheenBlu: number,
	color1Red: number,
	color1Blu: number,
	color2Red: number,
	color2Blu: number,
}

export const killstreakList = new Map<KillstreakColor, KillstreakDefinition>();

for (const killstreakJSON of killstreaks) {
	killstreakList.set(killstreakJSON.id, {
		name: killstreakJSON.name,
		sheen: killstreakJSON.id,
		teamColored: killstreakJSON.team ?? false,
		sheenRed: parseInt(killstreakJSON.sheen_red, 16),
		sheenBlu: parseInt(killstreakJSON.sheen_blu ?? killstreakJSON.sheen_red, 16),
		color1Red: parseInt(killstreakJSON.color1_red, 16),
		color1Blu: parseInt(killstreakJSON.color1_blu ?? killstreakJSON.color1_red, 16),
		color2Red: parseInt(killstreakJSON.color2_red, 16),
		color2Blu: parseInt(killstreakJSON.color2_blu ?? killstreakJSON.color2_red, 16),
	});
}

export function getKillstreak(killstreak: KillstreakColor): Killstreak | null {
	const killstreakDefinition = killstreakList.get(killstreak);
	if (killstreakDefinition) {
		return new Killstreak(killstreakDefinition);
	}
	return null;
}

function colorToTint(color: number, tint: vec3): void {
	tint[0] = ((color & 0xFF0000) >> 16) / 255.0;
	tint[1] = ((color & 0x00FF00) >> 8) / 255.0;
	tint[2] = ((color & 0x0000FF) >> 0) / 255.0;
}

/**
 * A TF2 Sheen
 */
export class Killstreak {
	#name: string;
	#killstreak: KillstreakColor;
	#sheenRed = vec3.create();
	#sheenBlu = vec3.create();
	#color1Red = vec3.create();
	#color1Blu = vec3.create();
	#color2Red = vec3.create();
	#color2Blu = vec3.create();
	readonly teamColored: boolean;

	constructor(definition: KillstreakDefinition) {
		this.#name = definition.name;
		this.#killstreak = definition.sheen;
		colorToTint(definition.sheenRed, this.#sheenRed);
		colorToTint(definition.sheenBlu, this.#sheenBlu);
		colorToTint(definition.color1Red, this.#color1Red);
		colorToTint(definition.color1Blu, this.#color1Blu);
		colorToTint(definition.color2Red, this.#color2Red);
		colorToTint(definition.color2Blu, this.#color2Blu);
		this.teamColored = definition.teamColored;
	}

	/**
	 * Compute the sheen color for the given team
	 * @param team The team to compute the color for
	 * @returns vec3
	 */
	getSheenColor(team: Team): vec3 {
		return vec3.clone(team == Team.Red ? this.#sheenRed : this.#sheenBlu);
	}

	getKillstreakColor1(team: Team): vec3 {
		return vec3.clone(team == Team.Red ? this.#color1Red : this.#color1Blu);
	}
}
