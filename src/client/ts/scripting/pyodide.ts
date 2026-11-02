import { registerPyodideModule } from 'harmony-3d-utils';
import { Characters } from './characters';
import { Engine } from './engine';
import { Entities } from './entities';
import { GlMatrix } from './glmatrix';
import { Items } from './items';
import { Loadout } from './loadout';
import { Primitives } from './primitives';
import { Source1 } from './source1';
import { Tf2 } from './tf2';
import { Utils } from './utils';

export async function initPyodideModules(): Promise<void> {
	await registerPyodideModule('loadout', new Loadout());
	await registerPyodideModule('engine', new Engine);
	await registerPyodideModule('characters', new Characters);
	await registerPyodideModule('items', new Items());
	await registerPyodideModule('tf2', new Tf2);
	await registerPyodideModule('entities', new Entities);
	await registerPyodideModule('source1', new Source1);
	await registerPyodideModule('glmatrix', new GlMatrix);
	await registerPyodideModule('primitives', new Primitives);
	await registerPyodideModule('utils', Utils);
}
