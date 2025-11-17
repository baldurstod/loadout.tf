import { createElement, hide } from 'harmony-ui';
import flexesPanelCSS from '../../css/flexespanel.css';
import { Controller, ControllerEvent } from '../controller';
import { Panel } from '../enums';
import { Character } from '../loadout/characters/character';
import { CharacterManager } from '../loadout/characters/charactermanager';
import { DynamicPanel } from './dynamicpanel';

export class FlexesPanel extends DynamicPanel {
	#htmlControllers?: HTMLElement;

	constructor() {
		super(Panel.Flexes, [flexesPanelCSS], false);
		hide(this.getShadowRoot());

		Controller.addEventListener(ControllerEvent.CharacterChanged, (event: Event) => {
			this.#onCharacterChanged((event as CustomEvent<Character>).detail)
		});
	}

	protected override initHTML(): void {
		createElement('div', {
			class: 'reset',
			i18n: '#reset_all',
			parent: this.getShadowRoot(),
			events: {
				click: () => { this.#resetFlexesAnims() },
			},
		});
		this.#htmlControllers = createElement('div', {
			class: 'controllers',
			parent: this.getShadowRoot(),
		});
	}

	async #resetFlexesAnims(): Promise<void> {
		await CharacterManager.getCurrentCharacter()?.resetFlexes();
	}

	async #onCharacterChanged(character: Character): Promise<void> {
		this.#htmlControllers?.replaceChildren();
		const characterModel = await character.getModel();
		const flexController = characterModel?.sourceModel?.mdl?.flexController;
		if (flexController) {
			const controllers = flexController.getControllers();
			for (const controllerName in controllers) {
				const controllerValue = controllers[controllerName]!;

				const htmlController = createElement('div', {
					innerText: controllerName,
					parent: this.#htmlControllers,
				});
				const htmlControllerInput: HTMLInputElement = createElement('input', {
					class: 'facialAnimControllerInput invertBackground',
					type: 'range',
					min: controllerValue.min * 100,
					max: controllerValue.max * 100,
					value: '0',
					events: {
						input: () => { character.setFlexControllerValue(controllerName, Number(htmlControllerInput.value) * 0.01) },
					},
					innerText: controllerName,
				}) as HTMLInputElement;

				htmlController.append(htmlControllerInput);
			}
		}
	}
}
