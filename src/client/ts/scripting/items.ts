import { Tf2Character, Tf2Effect, Tf2EffectTemplate, Tf2EffectType, Tf2ItemManager, Tf2ItemTemplate } from 'loadout';

export class Items {
	setCurrentCharacter(character: Tf2Character): void {
		return Tf2ItemManager.setCurrentCharacter(character);
	}

	setLang(lang: string): void {
		return Tf2ItemManager.setLang(lang);
	}

	getItems(): Map<string, Tf2ItemTemplate> {
		return Tf2ItemManager.getItems();
	}

	getItemTemplate(id: string | number, style?: number): Tf2ItemTemplate | null {
		return Tf2ItemManager.getItemTemplate(id, style);
	}

	getEffectTemplate(type: Tf2EffectType, id: number): Tf2EffectTemplate | null {
		return Tf2ItemManager.getEffectTemplate(type, id);
	}

	getEffectTemplateById(id: number): [Tf2EffectType, Tf2EffectTemplate] | null {
		return Tf2ItemManager.getEffectTemplateById(id);
	}

	getEffectTemplateBySystem(system: string): [Tf2EffectType, number, Tf2EffectTemplate] | null {
		return Tf2ItemManager.getEffectTemplateBySystem(system);
	}

	getFilteredItems(excluded: { e: number; }): [Map<string, Tf2ItemTemplate>, Map<string, Tf2ItemTemplate>] {
		return Tf2ItemManager.getFilteredItems(excluded);
	}

	getSelectedItems(): Set<string> {
		return Tf2ItemManager.getSelectedItems();
	}

	getSelectedEffects(): Set<Tf2Effect> {
		return Tf2ItemManager.getSelectedEffects();
	}

	getConflictingItems(): Set<string> {
		return Tf2ItemManager.getConflictingItems();
	}

	initItems(): Promise<void> {
		return Tf2ItemManager.initItems();
	}

	getEffects(type: Tf2EffectType): Map<number, Tf2EffectTemplate> {
		return Tf2ItemManager.getEffects(type);
	}

	getCollections(): Set<string> {
		return Tf2ItemManager.getCollections();
	}

	initWorkshopItems(): Promise<void> {
		return Tf2ItemManager.initWorkshopItems();
	}

	initTournamentMedals(): Promise<void> {
		return Tf2ItemManager.initTournamentMedals();
	}
}
