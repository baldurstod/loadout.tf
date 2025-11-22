import { Entity, Source1ModelInstance, Source1ModelManager, Source1ParticleControler, Source1ParticleSystem } from 'harmony-3d';

export class Source1 {
	async createModel(repository: string, path: string, parent?: Entity, dynamic = true): Promise<Source1ModelInstance | null> {
		const model = await Source1ModelManager.createInstance(repository, path, dynamic);
		if (!model) {
			return null;
		}
		model.setupPickingId();
		parent?.addChild(model);

		return model;
	}

	async createParticleSystem(repository: string, system: string, parent?: Entity, start = true): Promise<Source1ParticleSystem | null> {
		const sys = await Source1ParticleControler.createSystem(repository, system);
		if (!sys) {
			return null;
		}

		if (parent) {
			parent.addChild(sys);
			parent.addChild(sys.getControlPoint(0));
		}

		if (start) {
			sys.start();
		}

		return sys;
	}
}
