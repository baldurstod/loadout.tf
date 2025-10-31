import { vec3 } from 'gl-matrix';
import { Source1ParticleSystem } from 'harmony-3d';
import { KillstreakColor } from '../../paints/killstreaks';
import { EffectTemplate, EffectType } from './effecttemplate';


export const weaponEffects = new Map<number, [string, string]>([
	[701, ['hot', 'Hot']],
	[702, ['isotope', 'Isotope']],
	[703, ['cool', 'Cool']],
	[704, ['energyorb', 'Energy orb']],
]);

export class Effect {
	readonly template: EffectTemplate;
	name = '';
	system: Source1ParticleSystem | null = null;
	attachment?: string;
	offset = vec3.create();
	killstreakColor?: KillstreakColor;

	constructor(template: EffectTemplate) {
		this.template = template;
	}

	getId(): number {
		return this.template.id;
	}

	getType(): EffectType {
		return this.template.type;
	}
}
