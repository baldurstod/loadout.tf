import { uint } from 'harmony-types';
import { CharacterPosition, CharacterSlot, ClassAnimations, CustomDisposition, Tf2Character, Tf2CharacterManager, Tf2Class, Tf2Presets, Tf2Team } from 'loadout';
import { loadoutScene } from '../loadout/scene';

export class Characters {

	async selectCharacter(characterClass: Tf2Class, slotId?: uint): Promise<Tf2Character> {
		return Tf2CharacterManager.selectCharacter(characterClass, loadoutScene, slotId);
	}

	removeCharacter(slotId?: uint): void {
		Tf2CharacterManager.removeCharacter(slotId);
	}

	getSlot(slotId?: uint): CharacterSlot {
		return Tf2CharacterManager.getSlot(slotId);
	}

	setSlotsCount(size: uint, removeExisting?: boolean): void {
		Tf2CharacterManager.setSlotsCount(size, removeExisting);
	}


	async setTeam(team: Tf2Team): Promise<void> {
		return Tf2CharacterManager.setTeam(team);
	}

	getTeam(): Tf2Team {
		return Tf2CharacterManager.getTeam();
	}

	getCurrentCharacter(): Tf2Character | null {
		return Tf2CharacterManager.getCurrentCharacter();
	}

	setCustomTexture(itemId: string, customTextureName: string): void {
		return Tf2CharacterManager.setCustomTexture(itemId, customTextureName);
	}


	useDisposition(name: string | number): void {
		Tf2CharacterManager.useDisposition(name);
	}

	async setupMeetTheTeam(): Promise<void> {
		return Tf2CharacterManager.setupMeetTheTeam(loadoutScene);
	}

	getAnimList(): ClassAnimations | null {
		return Tf2CharacterManager.getAnimList();
	}

	loadPreset(name: string): void {
		return Tf2CharacterManager.loadPreset(name);
	}

	savePresets(): void {
		return Tf2CharacterManager.savePresets();
	}

	savePreset(name?: string): void {
		return Tf2CharacterManager.savePreset(name);
	}

	createPresetName(): string {
		return Tf2CharacterManager.createPresetName();
	}

	getPresets(): Tf2Presets | null {
		return Tf2CharacterManager.getPresets();
	}

	getCharacters(): Set<Tf2Character> {
		return Tf2CharacterManager.getCharacters();
	}

	getSlotsPositions(): Map<string, CharacterPosition[]> {
		return Tf2CharacterManager.getSlotsPositions();
	}

	refreshCustomDisposition(customDisposition: CustomDisposition): void {
		return Tf2CharacterManager.refreshCustomDisposition(customDisposition);
	}
}
