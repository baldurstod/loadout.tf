import { JSONObject } from 'harmony-types';
import { Layer } from './layer';

export class ProductPlacement {
	#placement: string;
	#technique: string;
	#printAreaType = 'simple';
	#layers: Layer[] = [];
	#conflictingPlacements: string[] = [];

	constructor(placement = '', technique = '') {
		this.#placement = placement;
		this.#technique = technique;
	}

	getPlacement(): string {
		return this.#placement;
	}

	getTechnique(): string {
		return this.#technique;
	}

	addLayer(layer: Layer): void {
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

	fromJSON(j: JSONObject): void {
		this.#placement = j.placement as string;
		this.#technique = j.technique as string;

		this.#layers = [];
		if (j.layers) {
			for (const layer of j.layers as JSONObject[]) {
				const l = new Layer();
				l.fromJSON(layer);
				this.#layers.push(l);
			}
		}

		this.#conflictingPlacements = [];
		if (j.conflicting_placements) {
			for (const conflictingPlacement of j.conflicting_placements as string[]) {
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
