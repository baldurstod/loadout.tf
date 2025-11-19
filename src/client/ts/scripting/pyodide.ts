import { loadScript } from 'harmony-browser-utils';
import { PyodideAPI } from 'pyodide';
//import { Characters } from '../loadout/datas/characterlist';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { ItemManager } from '../loadout/items/itemmanager';
import { Engine } from './engine';
import { Entities } from './entities';
import { Loadout } from './loadout';
import { Tf2 } from './tf2';
import { Utils } from './utils';

let initialized = false;
let pyodide: PyodideAPI;

let readyPromiseResolve: (value: boolean) => void;
const readyPromise = new Promise<boolean>((resolve) => readyPromiseResolve = resolve);

export async function getPyodide(): Promise<PyodideAPI> {
	if (!initialized) {
		initPyodide();
	}
	await readyPromise;

	return pyodide;
}


export async function initPyodide(): Promise<boolean> {
	if (initialized) {
		return true;
	}
	initialized = true;

	if (!await loadScript('./assets/js/pyodide/pyodide.js')) {
		return false;
	}

	pyodide = await (globalThis as any).loadPyodide({ jsglobals: {} });
	pyodide.setDebug(true);
	pyodide.setStderr({ batched: (msg) => console.log(msg) });
	pyodide.registerJsModule("loadout", new Loadout());
	pyodide.registerJsModule("engine", new Engine);
	pyodide.registerJsModule("characters", CharacterManager);
	pyodide.registerJsModule("items", ItemManager);
	pyodide.registerJsModule("tf2", new Tf2);
	pyodide.registerJsModule("entities", new Entities);
	//pyodide.registerJsModule("characters", Characters);
	pyodide.registerJsModule("utils", Utils);
	readyPromiseResolve(true);
	return true;
}
