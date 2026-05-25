import { Repository } from 'harmony-3d';
import { createElement, hide, show } from 'harmony-ui';
import itemCSS from '../../css/item.css';
import repositoriesPanelCSS from '../../css/repositoriespanel.css';
import repositoryEntryCSS from '../../css/repositoryentry.css';
import { Panel } from '../enums';
import { DynamicPanel } from './dynamicpanel';
import { addRepository } from './utils/repos';

export class RepositoriesPanel extends DynamicPanel {
	#htmlSheensDivSheens?: HTMLElement;

	constructor() {
		super(Panel.SfmRepositories, [repositoriesPanelCSS, itemCSS]);
		hide(this.getShadowRoot());
	}

	protected override initHTML(): void {
		const shadowRoot = this.getShadowRoot();
		this.getHTMLElement().addEventListener('click', () => this.close());

		const repositoriesInner = createElement('div', {
			class: 'inner',
			parent: shadowRoot,
			childs: [
				createElement('div'),
				this.#htmlSheensDivSheens = createElement('div'),
			],
		});

		repositoriesInner.addEventListener('click', event => { event.stopPropagation(); });
	}

	addRepository(repository: Repository): void {
		this.getHTMLElement();
		addRepository(repository, this.#htmlSheensDivSheens!, repositoryEntryCSS);
		show(this.getHTMLElement());

	}

	close(): void {
		hide(this.getHTMLElement());
	}
}
