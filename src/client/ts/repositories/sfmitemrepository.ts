import { RepositoryEntry, RepositoryFileListResponse, WebRepository } from 'harmony-3d';
import { JSONObject } from 'harmony-types';

export class SfmItemRepository extends WebRepository {
	#initPromiseResolve?: (value: boolean) => void;
	#initPromise = new Promise(resolve => this.#initPromiseResolve = resolve);
	#files: string[] = [];//Record<string, string> = {};

	constructor(name: string, base: string, useCacheApi = false) {
		super(name, base, useCacheApi);

		this.#initRepo();
	}

	async #initRepo(): Promise<void> {
		const url = this.base + 'manifest.json';
		const response = await fetch(url);


		const populateFiles = (level: JSONObject, path: string) => {
			for (const segment in level) {
				const f = level[segment];
				if (f == 1) {
					this.#files.push(path + segment)
				} else {
					populateFiles((f as JSONObject), path + segment + '/')
				}
			}
		}

		try {
			const j = await response.json();
			console.info(j);
			populateFiles(j, '');
			console.info(this.#files);
		} catch (e) {
			console.error(`error while fetching ${url}`, e);
		}

		this.#initPromiseResolve?.(true);
	}

	async getFileList(): Promise<RepositoryFileListResponse> {
		await this.#initPromise;
		const root = new RepositoryEntry(this, '', true, 0);

		for (const filename of this.#files) {
			root.addPath(filename);
		}

		return { root: root };
	}
}
