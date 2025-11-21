import { Editor, EditSession } from 'ace-builds';
import { LineWidget } from 'ace-builds-internal/line_widgets';
import { loadScripts } from 'harmony-browser-utils';
import { createElement, defineHarmonyInfoBox, I18n, shadowRootStyle } from 'harmony-ui';
import scriptEditorCSS from '../../css/scripteditor.css';
import { ACE_EDITOR_URI, SNIPPET_URL } from '../constants';
import { getPyodide } from '../scripting/pyodide';
import { InterruptError, Utils } from '../scripting/utils';

export type ScriptEditorOptions = {
	aceUrl?: string;
};

export class ScriptEditor extends HTMLElement {
	#aceEditorResolve!: () => void;
	#aceEditorReady = new Promise((resolve: (value: void) => void) => this.#aceEditorResolve = resolve);
	#initialized = false;
	#annotationsDelay = 500;
	#shadowRoot?: ShadowRoot;
	#aceEditor?: Editor;
	//#htmlErrors?: HTMLTextAreaElement;
	#sessions = new Map<string, EditSession>;
	#currentSession: EditSession | null = null;
	//#interruptBuffer = new Uint8Array(new SharedArrayBuffer(1));
	//#pyodideWorker = new Worker(new URL("pyodideworker.js", import.meta.url));

	initEditor(options: ScriptEditorOptions = {}): void {
		if (this.#initialized) {
			return;
		}
		defineHarmonyInfoBox();

		//this.#pyodideWorker.postMessage({ cmd: "setInterruptBuffer", interruptBuffer: this.#interruptBuffer });

		this.#shadowRoot = this.attachShadow({ mode: 'closed' });
		shadowRootStyle(this.#shadowRoot, scriptEditorCSS);
		I18n.observeElement(this.#shadowRoot);


		const aceScript: string = options.aceUrl ?? ACE_EDITOR_URI;
		this.#initialized = true;

		this.style.cssText = 'display: flex;flex-direction: column;height: 100%;width: 100%;';

		createElement('button', {
			parent: this.#shadowRoot,
			i18n: '#run',
			$click: () => { this.#run() },
		}) as HTMLButtonElement;

		createElement('button', {
			parent: this.#shadowRoot,
			i18n: '#stop',
			$click: () => { this.#stop() },
		}) as HTMLButtonElement;

		createElement('harmony-info-box', {
			parent: this.#shadowRoot,
			type: 'error',
			i18n: '#script_warning',
		});
		createElement('harmony-info-box', {
			parent: this.#shadowRoot,
			type: 'ok',
			childs: [
				createElement('span', { i18n: '#script_snippets', }),
				createElement('a', { href: SNIPPET_URL, innerText: SNIPPET_URL, target: '_blank', style: 'color:white;' }),
			],
		});

		/*
		createElement('button', {
			parent:this.#shadowRoot,
			i18n: '#stop',
			$click: () => this.#stop(),
		}) as HTMLButtonElement;
		*/

		const container = createElement('div', { style: 'flex:1;', parent: this.#shadowRoot });
		//this.#htmlErrors = createElement('textarea', { style: 'flex:1;', parent: this.#shadowRoot }) as HTMLTextAreaElement;

		if (aceScript == '') {
			this.#initEditor2(container);
		} else {
			loadScripts([aceScript]).then(() => {
				loadScripts(['./assets/js/ace-builds/src-min/ext-language_tools.js', './assets/js/ace-builds/src-min/ext-code_lens.js']).then(() => this.#initEditor2(container));
				//loadScripts([aceScript]).then(() => this.#initEditor2(container));
			})
		}

		this.#addSession('test'/*TODO: change name*/);
	}

	async #run(): Promise<void> {
		Utils.setInterrupt(false);
		const scriptText = this.#aceEditor!.getValue();

		const session = this.#currentSession!;


		(await getPyodide()).runPythonAsync(scriptText).catch(
			(e: unknown) => {
				if (e instanceof Error) {
					if (e.stack?.includes(InterruptError)) {
						// TODO: process interruption
						return;
					}
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
					//this.#htmlErrors!.value = message;
					this.#addErrorWidget(session, message);
				} else {
					console.error(e);
					//this.#htmlErrors!.value = String(e);
					this.#addErrorWidget(session, String(e));
				}

				//const range = new (globalThis as any).ace.Range(0, 0, 0, 10);
				//this.#currentSession?.addMarker(range, "ace_link_marker", "text", true);
			}
		);
		//this.#pyodideWorker.postMessage({ cmd: "runCode", scriptText });
	}

	#stop(): void {
		Utils.setInterrupt(true);
	}

	#initEditor2(id: HTMLElement): void {
		this.#aceEditor = (globalThis as any).ace.edit(id) as Editor;
		this.#aceEditor.setOptions({
			enableBasicAutocompletion: true,
			enableSnippets: true,
			enableLiveAutocompletion: true
		});
		this.#aceEditorResolve();
		this.#aceEditor.renderer.attachToShadowRoot();
		//this.#aceEditor.$blockScrolling = Infinity;
		this.#aceEditor.setTheme('ace/theme/monokai');
		//this.#scriptEditor.getSession().setMode('ace/mode/python');
		/*
		this.#scriptEditor.getSession().on('change', () => {
			//clearTimeout(this.#recompileTimeout);
			//this.#recompileTimeout = setTimeout(() => { this.recompile() }, this.#recompileDelay);//TODO:
		});
		*/

		this.#aceEditor.commands.addCommand({
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

	async #addSession(name: string): Promise<void> {
		await this.#aceEditorReady;
		const session = new (globalThis as any).ace.EditSession('');
		session.setMode('ace/mode/python');

		this.#sessions.set(name, session);
		await this.setSession(session);
	}



	async setSession(session: EditSession): Promise<void> {
		await this.#aceEditorReady;
		this.#currentSession = session;
		this.#aceEditor!.setSession(session);
	}

	#addLineWidget(session: EditSession, element: HTMLElement): LineWidget {
		const LineWidgets = require("ace/line_widgets").LineWidgets;
		if (!session.widgetManager) {
			session.widgetManager = new LineWidgets(session);
			session.widgetManager.attach(this.#aceEditor!);
		}
		const w: LineWidget = {
			row: 0,
			fixedWidth: true,
			coverGutter: false,
			el: element,
		};

		session.widgetManager.addLineWidget(w);
		return w;
	}

	#addErrorWidget(session: EditSession, error: string): void {
		const lineWidget = this.#addLineWidget(session, createElement('div', {
			class: 'widget error',
			childs: [
				createElement('button', {
					i18n: '#clear_error',
					$click: () => session.widgetManager.removeLineWidget(lineWidget),
				}),
				createElement('div', {
					class: 'text',
					innerText: error,
				}),
			]
		}));
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
