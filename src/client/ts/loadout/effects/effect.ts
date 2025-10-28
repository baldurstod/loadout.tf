import { vec3 } from 'gl-matrix';
import { Source1ParticleSystem } from 'harmony-3d';

export class Effect {
	name = '';
	system: Source1ParticleSystem | null = null;
	attachment?: string;
	offset?: vec3;
}
