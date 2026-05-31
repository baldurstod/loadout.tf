import { Entity, Repository, RepositoryEntry } from 'harmony-3d';
import { HTMLRepositoryElement } from 'harmony-3d-utils';
import { createElement, I18n } from 'harmony-ui';
import optionsCSS from '../../../css/options.css';
import { CharacterManager } from '../../loadout/characters/charactermanager';
import { addTF2Model, loadoutScene } from '../../loadout/scene';

const modelsByRepoEntry = new Map<RepositoryEntry, Entity[]>();
const buttonByRepoEntry = new Map<RepositoryEntry, HTMLElement>();

export function addRepository(repository: Repository, parent: HTMLElement, style: string): void {

	const repositoryView = createElement('harmony3d-repository', {
		parent: parent,
		adoptStyle: style,
		events: {
			fileclick: (event: CustomEvent) => console.info((event).detail.getFullName()),
			directoryclick: (event: CustomEvent) => console.info((event).detail.getFullName(), event),
			entrycreated: (event: CustomEvent) => {
				let removeButton;
				createElement('div', {
					class: 'custom-buttons',
					adoptStyle: optionsCSS,
					parent: (event).detail.view,
					slot: 'custom',
					childs: [
						createElement('button', {
							class: 'option-button',
							i18n: '#add_to_scene',
							events: {
								click: () => { addModel((event).detail.entry) },
							}
						}),
						createElement('button', {
							i18n: '#add_to_current_character',
							events: {
								// eslint-disable-next-line @typescript-eslint/no-misused-promises
								click: async () => addModel((event).detail.entry, await CharacterManager.getCurrentCharacter()?.getModel()),
							}
						}),
						removeButton = createElement('button', {
							i18n: '#remove_model',
							style: 'opacity:0',
							//hidden: true,
							events: {
								// eslint-disable-next-line @typescript-eslint/no-misused-promises
								click: () => removeModel((event).detail.entry),
							}
						}),
					]
				});
				I18n.observeElement((event).detail.view);
				buttonByRepoEntry.set((event).detail.entry, removeButton);
			},
		}
	}) as HTMLRepositoryElement;
	repositoryView.setFilter({ extension: 'mdl', directories: false });
	repositoryView.setRepository(repository);
}

async function addModel(entry: RepositoryEntry, parent?: Entity | null): Promise<void> {
	const model = await addTF2Model(loadoutScene, entry.getFullName(), entry.getRepository().name);

	if (model) {
		const m = modelsByRepoEntry.get(entry);
		if (!m) {
			modelsByRepoEntry.set(entry, [model]);
		} else {
			m.push(model);
		}

		setOpacity(buttonByRepoEntry.get(entry)!, 100);

		if (parent) {
			parent.addChild(model);
		}
	}
}

async function removeModel(entry: RepositoryEntry): Promise<void> {
	const m = modelsByRepoEntry.get(entry);
	if (m) {
		m.pop()?.remove();
		if (m.length === 0) {
			setOpacity(buttonByRepoEntry.get(entry)!, 0);
		}
	}
}

function setOpacity(button: HTMLElement, opacity: number): void {
	button.style.opacity = `${opacity}%`;
}
