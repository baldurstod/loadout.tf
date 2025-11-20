export const InterruptError = new Error('stopped');

export class Utils {
	static #interrupt = false;

	static setInterrupt(interrupt: boolean): void {
		this.#interrupt = interrupt;
	}

	static interrupt(): void {
		if (this.#interrupt) {
			this.#interrupt = false;
			throw InterruptError
		}
	}
}
