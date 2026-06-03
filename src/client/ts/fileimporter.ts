import { ManifestRepository, MergeRepository, PathPrefixRepository, Repositories, Repository, sanitizeRepositoryName, Source1ModelManager, Source1ParticleControler, VpkRepository, ZipRepository } from "harmony-3d";
import { PersistentStorage } from "harmony-browser-utils";
import { Controller, ControllerEvent } from "./controller";

const IMPORTED_FILES_PATH = '/imported_files/';

export async function importFile(file: File, overrideModels: boolean): Promise<void> {
	if (!await PersistentStorage.writeFile(IMPORTED_FILES_PATH + file.name, file)) {
		const estimate = await PersistentStorage.estimate();
		console.error(`failed to save file ${file.name} to persistent storage, estimate: `, estimate);
	}
	await importFile2(file, overrideModels);
}

export async function restoreFiles(overrideModels: boolean): Promise<void> {
	for await (const entry of PersistentStorage.listEntries(IMPORTED_FILES_PATH)) {
		console.info(entry);
		if (entry.kind === 'directory') {
			break;
		}
		const file = await (entry as FileSystemFileHandle).getFile();
		await importFile2(file, overrideModels);
	}
}

export async function removeRepository(repository: Repository): Promise<void> {
	const filename = repository.properties.get('filename') as undefined | string;
	if (!filename) {
		return;
	}
	await PersistentStorage.deleteFile(IMPORTED_FILES_PATH + filename);
}

async function importFile2(file: File, overrideModels: boolean): Promise<void> {
	//TODO: check zip
	const tf2Repository = Repositories.getRepository('tf2') as MergeRepository;

	for await (const localRepo of mountRepo(file)) {
		localRepo.properties.set('filename', file.name);
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
	zipRepo.properties.set('description', file.name);
	const response = await zipRepo.getFileList();
	const root = response.root;
	if (root) {
		let once = true;
		for (const child of root.getChilds()) {
			if (!child.isDirectory()) {
				continue;
			}
			const name = child.getName();
			switch (name) {
				case 'materials':
				case 'models':
					if (once) {
						yield zipRepo;
						once = false;
					}
					break;
				case 'custom':
					for (const child2 of child.getChilds()) {
						if (!child2.isDirectory()) {
							continue;
						}
						const name2 = child2.getName();
						yield new PathPrefixRepository(name2, zipRepo, `${name}/${name2}`);
					}

					break;

				default:
					yield new PathPrefixRepository(name, zipRepo, name)
					break;
			}
		}
	}

	return null;
}

export async function addRepo(repo: Repository): Promise<void> {
	Controller.dispatchEvent<Repository>(ControllerEvent.RepositoryAdded, { detail: repo });
}
