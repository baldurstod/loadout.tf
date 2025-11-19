import { loadScripts } from 'harmony-browser-utils';
import { createElement, I18n } from 'harmony-ui';
import { ACE_EDITOR_URI } from '../constants';
import { getPyodide } from '../scripting/pyodide';
import { Utils } from '../scripting/utils';

export type ScriptEditorOptions = {
	aceUrl?: string;
};

export class ScriptEditor extends HTMLElement {
	#initialized = false;
	#annotationsDelay = 500;
	#shadowRoot?: ShadowRoot;
	#scriptEditor?: any/*TODO: fix type*/;
	#htmlErrors?: HTMLTextAreaElement;
	//#interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
	//#pyodideWorker = new Worker(new URL("pyodideworker.js", import.meta.url));

	initEditor(options: ScriptEditorOptions = {}): void {
		if (this.#initialized) {
			return;
		}

		//this.#pyodideWorker.postMessage({ cmd: "setInterruptBuffer", interruptBuffer: this.#interruptBuffer });

		this.#shadowRoot = this.attachShadow({ mode: 'closed' });
		I18n.observeElement(this.#shadowRoot);


		const aceScript: string = options.aceUrl ?? ACE_EDITOR_URI;
		this.#initialized = true;

		this.style.cssText = 'display: flex;flex-direction: column;height: 100%;width: 100%;';

		createElement('button', {
			parent: this.#shadowRoot,
			i18n: '#run',
			$click: () => { this.#run() },
		}) as HTMLButtonElement;

		/*
		createElement('button', {
			parent:this.#shadowRoot,
			i18n: '#stop',
			$click: () => this.#stop(),
		}) as HTMLButtonElement;
		*/

		const container = createElement('div', { style: 'flex:1;', parent: this.#shadowRoot });
		this.#htmlErrors = createElement('textarea', { style: 'flex:1;', parent: this.#shadowRoot }) as HTMLTextAreaElement;

		if (aceScript == '') {
			this.#initEditor2(container);
		} else {
			loadScripts([aceScript, './assets/js/ace-builds/src-min/ext-language_tools.js']).then(() => this.#initEditor2(container));
		}
	}

	async #run(): Promise<void> {
		Utils.setInterrupt(false);
		const scriptText = this.#scriptEditor.getValue();


		(await getPyodide()).runPythonAsync(scriptText).catch(
			(e: unknown) => {
				console.error(e);
				if (e instanceof Error) {
					let message;
					/*
					if (e.cause) {
						message += e.cause;
					}
					*/
					if (e.stack) {
						message = e.stack;
					} else {
						message = e.name + ': ' + e.message;
					}
					this.#htmlErrors!.value = message;
				} else {
					this.#htmlErrors!.value = String(e);
				}
			}
		);
		//this.#pyodideWorker.postMessage({ cmd: "runCode", scriptText });
	}

	#stop(): void {
		Utils.setInterrupt(true);
	}

	#initEditor2(id: HTMLElement): void {
		this.#scriptEditor = (globalThis as any).ace.edit(id);
		this.#scriptEditor.setOptions({
			enableBasicAutocompletion: true,
			enableSnippets: true,
			enableLiveAutocompletion: true
		});
		this.#scriptEditor.renderer.attachToShadowRoot();
		this.#scriptEditor.$blockScrolling = Infinity;
		this.#scriptEditor.setTheme('ace/theme/monokai');
		this.#scriptEditor.getSession().setMode('ace/mode/python');
		this.#scriptEditor.getSession().on('change', () => {
			//clearTimeout(this.#recompileTimeout);
			//this.#recompileTimeout = setTimeout(() => { this.recompile() }, this.#recompileDelay);//TODO:
		});

		this.#scriptEditor.commands.addCommand({
			name: 'myCommand',
			bindKey: { win: 'Ctrl-Shift-C', mac: 'Command-M' },
			exec: () => {
				//this.recompile();
			},
		});
	}

	setAnnotations(): void {
		/*
		if (shaderName == this.#editorShaderName) {
			this.#scriptEditor.getSession().setAnnotations(ShaderManager.getCustomSourceAnnotations(shaderName));
		}
		*/
	}
	/*

	set annotationsDelay(delay: number) {
		this.#annotationsDelay = delay;
	}
		*/
}

if (window.customElements) {
	customElements.define('script-editor', ScriptEditor);
}
