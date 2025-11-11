import { JSONObject } from 'harmony-types';

export class Layer {
	#type = 'file';
	#url: string;
	#position?: LayerPosition;

	constructor(url = '', position?: LayerPosition) {
		this.#url = url;
		this.#position = position;
	}

	setPosition(position?: LayerPosition): void {
		this.#position = position;
	}

	fromJSON(j: JSONObject): void {
		this.#url = j.url as string;

		if (j.position) {
			const position = j.position as JSONObject;
			this.#position = new LayerPosition(position.width as number, position.width as number, position.width as number, position.width as number)
		}
	}


	toJSON(): JSONObject {
		return {
			type: this.#type,
			...(this.#url && { url: this.#url }),
			...(this.#position && { position: this.#position.toJSON() }),
		};
	}
}

export class LayerPosition {
	#width: number;
	#height: number;
	#top: number;
	#left: number;

	constructor(width: number, height: number, top: number, left: number) {
		this.#width = width;
		this.#height = height;
		this.#top = top;
		this.#left = left;
	}

	toJSON(): JSONObject {
		return {
			width: this.#width,
			height: this.#height,
			top: this.#top,
			left: this.#left,
		};
	}
}
