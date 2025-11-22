import { Entity, Source1ModelInstance, Source1ModelManager } from "harmony-3d";

export class Source1 {
	async createSource1Model(repository: string, path: string, parent?: Entity, dynamic = true): Promise<Source1ModelInstance | null> {
		const model = await Source1ModelManager.createInstance(repository, path, dynamic);
		if (!model) {
			return null;
		}
		model.setupPickingId();
		parent?.addChild(model);

		return model;
	}
}
