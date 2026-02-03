import { ManifestRepository, MergeRepository, PathPrefixRepository, Repositories, Repository, sanitizeRepositoryName, Source1ModelManager, Source1ParticleControler, VpkRepository, ZipRepository } from "harmony-3d";
import { Controller, ControllerEvent } from "./controller";

export async function importFile(file: File, overrideModels: boolean): Promise<void> {
	//TODO: check zip
	const tf2Repository = Repositories.getRepository('tf2') as MergeRepository;

	for await (const localRepo of mountRepo(file)) {
		if (overrideModels) {
			//TODO:add message
			tf2Repository.unshiftRepository(localRepo);
			addRepo(localRepo);
			Repositories.addRepository(new MergeRepository(localRepo.name, localRepo, tf2Repository));
		} else {
			const repo = new ManifestRepository(new MergeRepository(localRepo.name, localRepo, tf2Repository));
			Repositories.addRepository(repo);
			await repo.generateModelManifest();
			await repo.generateParticlesManifest();
			addRepo(localRepo);
			Source1ModelManager.loadManifest(localRepo.name);
			Source1ParticleControler.loadManifest(localRepo.name);
		}
	}
}

async function* mountRepo(file: File): AsyncGenerator<Repository, null, undefined> {
	if (file.name.endsWith('.zip')) {
		const repoGenerator = mountZip(file);
		for await (const repo of repoGenerator) {
			yield repo;
		}
	} else if (file.name.endsWith('.vpk')) {
		yield new VpkRepository(sanitizeRepositoryName(file.name), [file]);
	}
	return null;
}

async function* mountZip(file: File): AsyncGenerator<Repository, null, undefined> {
	//const repo = new MergeRepository(file.name);
	const zipRepo = new ZipRepository(sanitizeRepositoryName(file.name), file);
	const response = await zipRepo.getFileList();
	const root = response.root;
	if (root) {
		for (const child of root.getChilds()) {
			if (!child.isDirectory()) {
				continue;
			}
			const name = child.getName();
			switch (name) {
				case 'materials':
				case 'models':
					//repo.pushRepository(new PathPrefixRepository())
					//repo.pushRepository(zipRepo);
					yield zipRepo;

					break;
				case 'custom':
					for (const child2 of child.getChilds()) {
						if (!child2.isDirectory()) {
							continue;
						}
						const name2 = child2.getName();
						//repo.pushRepository(new PathPrefixRepository(name2, zipRepo, `${name}/${name2}`))
						yield new PathPrefixRepository(name2, zipRepo, `${name}/${name2}`);
					}

					break;

				default:
					//repo.pushRepository(new PathPrefixRepository(name, zipRepo, name))
					yield new PathPrefixRepository(name, zipRepo, name)
					break;
			}
		}
	}

	return null;
}



async function addRepo(repo: Repository): Promise<void> {
	const root = await repo.getFileList();
	if (!root) {
		return;
	}

	Controller.dispatchEvent<Repository>(ControllerEvent.RepositoryAdded, { detail: repo });
}
