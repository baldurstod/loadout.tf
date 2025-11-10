import { JSONObject } from 'harmony-types';
import { Layer } from './layer';

export class ProductPlacement {
	#placement: string;
	#technique: string;
	#printAreaType = 'simple';
	#layers: Array<Layer> = [];
	#conflictingPlacements: Array<string> = [];

	constructor(placement: string = '', technique: string = '') {
		this.#placement = placement;
		this.#technique = technique;
	}

	getPlacement() {
		return this.#placement;
	}

	getTechnique() {
		return this.#technique;
	}

	addLayer(layer: Layer) {
		this.#layers.push(layer);
	}

	isConflicting(otherPlacement: string): boolean {
		for (const conflictingPlacement of this.#conflictingPlacements) {
			if (conflictingPlacement == otherPlacement) {
				return true;
			}
		}
		return false;
	}

	fromJSON(j: JSONObject) {
		this.#placement = j.placement as string;
		this.#technique = j.technique as string;

		this.#layers = [];
		if (j.layers) {
			for (const layer of j.layers as Array<JSONObject>) {
				const l = new Layer();
				l.fromJSON(layer);
				this.#layers.push(l);
			}
		}

		this.#conflictingPlacements = [];
		if (j.conflicting_placements) {
			for (const conflictingPlacement of j.conflicting_placements as Array<string>) {
				this.#conflictingPlacements.push(conflictingPlacement);
			}
		}
	}

	toJSON(): JSONObject {
		const layers = [];
		for (const item of this.#layers) {
			layers.push(item.toJSON());
		}

		return {
			placement: this.#placement,
			technique: this.#technique,
			print_area_type: this.#printAreaType,
			layers: layers,
		};
	}
}
