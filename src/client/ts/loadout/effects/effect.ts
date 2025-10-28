import { vec3 } from 'gl-matrix';
import { Source1ParticleSystem } from 'harmony-3d';


export const weaponEffects = new Map<number, [string, string]>([
	[701, ['hot', 'Hot']],
	[702, ['isotope', 'Isotope']],
	[703, ['cool', 'Cool']],
	[704, ['energyorb', 'Energy orb']],
]);

export class Effect {
	name = '';
	system: Source1ParticleSystem | null = null;
	attachment?: string;
	offset?: vec3;
}
