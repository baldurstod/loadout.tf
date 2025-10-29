// @ts-expect-error no ts declaration
import { containerBootstrap } from '@nlpjs/core';
// @ts-expect-error no ts declaration
import { Nlp } from '@nlpjs/nlp';
// @ts-expect-error no ts declaration
import { LangEn } from '@nlpjs/lang-en-min';

export enum LoadoutSpeechError {
	Ok = 0,
	Unavailable,
	Uninitialized,
	UnhandledError,
}

const Speech = window.SpeechRecognition || window.webkitSpeechRecognition

export class LoadoutSpeech extends EventTarget {
	static #instance: LoadoutSpeech;
	#recognition?: SpeechRecognition;
	#active = false;
	#lang = '';
	#nlp: any;

	constructor() {
		if (LoadoutSpeech.#instance) {
			return LoadoutSpeech.#instance;
		}
		super();
		LoadoutSpeech.#instance = this;
	}

	setLang(lang: string): void {
		this.#lang = lang;
		if (this.#recognition) {
			this.#recognition.lang = lang;
		}
	}

	start(): LoadoutSpeechError {
		this.#active = true;
		if (!this.#recognition) {
			const err = this.#init();
			if (err != LoadoutSpeechError.Ok) {
				return err;
			}
		}

		const err = this.#start();
		if (err != LoadoutSpeechError.Ok) {
			return err;
		}

		return LoadoutSpeechError.Ok;
	}

	stop(): LoadoutSpeechError {
		this.#active = false;
		if (!this.#recognition) {
			return LoadoutSpeechError.Uninitialized;
		}

		this.#stop();

		return LoadoutSpeechError.Ok;
	}

	#init(): LoadoutSpeechError {
		const err: LoadoutSpeechError = this.#initSpeech();
		if (err != LoadoutSpeechError.Ok) {
			return err;
		}

		this.#initNlp();
		if (err != LoadoutSpeechError.Ok) {
			return err;
		}

		return LoadoutSpeechError.Ok;
	}

	#initSpeech(): LoadoutSpeechError {
		if (this.#recognition) {
			return LoadoutSpeechError.Ok;
		}

		try {
			this.#recognition = new Speech();
			this.#recognition.lang = this.#lang;
			this.#recognition.maxAlternatives = 5;
			this.#recognition.addEventListener('end', () => {
				if (this.#active) {
					this.#start();
				}
			});
			this.#recognition.addEventListener('result', (event: SpeechRecognitionEvent) => {
				this.#onResult(event);
			});
			this.dispatchEvent(new CustomEvent('speech-init'));
		} catch (e) {
			console.warn('SpeechRecognition is unavailable', e);
			return LoadoutSpeechError.Unavailable;
		}
		return LoadoutSpeechError.Ok;
	}

	#initNlp(): LoadoutSpeechError {
		try {
			if (this.#nlp) {
				return LoadoutSpeechError.Ok;
			}

			const container = containerBootstrap();
			container.use(Nlp);
			container.use(LangEn);
			this.#nlp = container.get('nlp');
			this.#nlp.addLanguage('en');
			this.#nlp.settings.autoSave = false;
			this.#nlp.train();
			this.dispatchEvent(new CustomEvent('nlp-init'));
		} catch (e) {
			console.warn('Can\'t init nlp', e);
			return LoadoutSpeechError.UnhandledError;
		}

		return LoadoutSpeechError.Ok;
	}

	#start(): LoadoutSpeechError {
		if (this.#recognition) {
			try {
				this.#recognition.start();
			} catch (e) {
				if (e == DOMException.INVALID_STATE_ERR) {
					return LoadoutSpeechError.Ok;
				} else {
					return LoadoutSpeechError.UnhandledError;
				}
			}
			return LoadoutSpeechError.Ok;
		}
		return LoadoutSpeechError.Uninitialized;
	}

	#stop(): void {
		if (this.#recognition) {
			this.#recognition.stop();
		}
	}

	async #onResult(event: SpeechRecognitionEvent): Promise<void> {
		if (event.results.length == 0) {
			return;
		}

		console.info(event.results[0]);


		let stop = false;
		for (const alternative of event.results[0]!) {
			const input = await this.#nlp.process('en', alternative.transcript);
			console.info(input);
			if (input) {
				//this.dispatchEvent(new CustomEvent('intent', { detail: input }));
				this.dispatchEvent(new CustomEvent(input.intent, { detail: { input: input, acknowledged: (): boolean => (stop = true) } }));
			}
			if (stop) {
				break;
			}
		}
	}

	addNerRuleOptionTexts(locale: string, name: string, option: string, texts: string[]): LoadoutSpeechError {
		const err = this.#initNlp();
		if (err != LoadoutSpeechError.Ok) {
			return err;
		}

		this.#nlp.addNerRuleOptionTexts(locale, name, option, texts);

		return LoadoutSpeechError.Ok;
	}

	addDocument(locale: string, utterances: string[] | string, intent: string): LoadoutSpeechError {
		const err = this.#initNlp();
		if (err != LoadoutSpeechError.Ok) {
			return err;
		}

		if (typeof utterances == 'string') {
			this.#nlp.addDocument(locale, utterances, intent);
		} else {
			for (const utterance of utterances) {
				this.#nlp.addDocument(locale, utterance, intent);
			}
		}

		return LoadoutSpeechError.Ok;
	}

	async train(): Promise<void> {
		if (this.#nlp) {
			await this.#nlp.train();
		}
	}
}
