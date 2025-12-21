import { JSONObject } from 'harmony-types';
import { SHADERTOY_DIRECTORY } from '../constants';

let list: JSONObject | null = null;

async function getShaders(): Promise<JSONObject | null> {
	if (list) {
		return list;
	}

	list = await (await fetch(SHADERTOY_DIRECTORY + 'list.json')).json();

	return list;
}

export async function getShaderToyList(): Promise<Set<string>> {
	const list = new Set<string>();

	const shaders = await getShaders();

	if (!shaders) {
		return list;
	}

	for (let key in shaders) {
		list.add(key);
	}

	return list;
}

export async function getShaderToy(name: string): Promise<JSONObject | null> {
	const shaders = await getShaders();

	if (!shaders) {
		return null;
	}

	return shaders[name] as JSONObject ?? null;
}
