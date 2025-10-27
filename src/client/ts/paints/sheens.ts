import { vec3 } from 'gl-matrix';
import sheens from '../../json/sheens.json';
import { Team } from '../loadout/enums';

export enum Sheens {
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

export type SheenDefinition = {
	name: string,
	sheen: Sheens,
	teamColored: boolean,
	tintRed: number,
	tintBlu: number,
}

export const sheenList = new Map<Sheens, SheenDefinition>();

for (const sheenJSON of sheens) {
	sheenList.set(sheenJSON.id, {
		name: sheenJSON.name,
		sheen: sheenJSON.id,
		teamColored: sheenJSON.team ?? false,
		tintRed: parseInt(sheenJSON.tint_red, 16),
		tintBlu: parseInt(sheenJSON.tint_blu ?? sheenJSON.tint_red, 16),
	});
}

export function getSheen(sheen: Sheens): Sheen | null {
	const sheenDefinition = sheenList.get(sheen);
	if (sheenDefinition) {
		return new Sheen(sheenDefinition);
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
export class Sheen {
	#name: string;
	#sheen: Sheens;
	#tintRed = vec3.create();
	#tintBlu = vec3.create();
	#tint = vec3.create();
	teamColored: boolean;

	constructor(definition: SheenDefinition) {
		this.#name = definition.name;
		this.#sheen = definition.sheen;
		colorToTint(definition.tintRed, this.#tintRed);
		colorToTint(definition.tintBlu, this.#tintBlu);
		this.teamColored = definition.teamColored;
	}

	/**
	 * Compute the sheen tint for the given team
	 * @param team The team to compute the tint for
	 * @returns vec3
	 */
	getTint(team: Team): vec3 {
		return team == Team.Red ? this.#tintRed : this.#tintBlu;
	}
}
