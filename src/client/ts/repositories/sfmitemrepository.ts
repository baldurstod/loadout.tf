import { RepositoryEntry, RepositoryFileListResponse, RepositoryHasFileResponse, WebRepository } from 'harmony-3d';
import { JSONObject } from 'harmony-types';
import { setTimeoutPromise } from 'harmony-utils';

const RETRIES = 10;
const RETRY_AFTER = 10000;

export class SfmItemRepository extends WebRepository {
	#initPromiseResolve?: (value: boolean) => void;
	#initPromise = new Promise(resolve => this.#initPromiseResolve = resolve);
	#files = new Set<string>();

	constructor(name: string, base: string, useCacheApi = false) {
		super(name, base, useCacheApi);

		this.supportedExtensions.add('vmt');
		this.supportedExtensions.add('vtf');

		this.#initRepo();
	}

	async #initRepo(): Promise<void> {
		const url = this.base + `manifest.json?t=${new Date().getTime()}`;

		const populateFiles = (level: JSONObject, path: string) => {
			for (const segment in level) {
				const f = level[segment];
				if ((f as number) > 0) {
					this.#files.add(path + segment)
				} else {
					populateFiles((f as JSONObject), path + segment + '/')
				}
			}
		}

		for (let i = 0; i < RETRIES; i++) {
			try {
				const response = await fetch(url);
				if (response.ok) {
					const j = await response.json();
					populateFiles(j, '');
					this.setFiles(j);
					break;
				}
			} catch (e) {
				console.error(`error while fetching ${url}`, e);
			}
			await setTimeoutPromise(RETRY_AFTER);
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

	async hasFile(path: string): Promise<RepositoryHasFileResponse> {
		await this.#initPromise;
		return super.hasFile(path);
	}
}
