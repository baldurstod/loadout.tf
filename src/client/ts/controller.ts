import { BackgroundType } from "./enums";
import { ItemTemplate } from "./loadout/items/itemtemplate";

export enum ControllerEvent {
	UseBots = 'usebots',
	ShowCompetitiveStage = 'showcompetitivestage',
	ChangeMap = 'changemap',
	InitMapList = 'initmaplist',
	ToggleVideo = 'togglevideo',
	SetBackgroundType = 'setbackgroundtype',
	OverrideTextures = 'overridetextures',
	ShowBadge = 'showbadge',
	ImportFile = 'importfile',
	//HideAllPanels = 'hideallpanels',
	ShowPanel = 'showpanel',
	TogglePanel = 'togglepanel',
	ShareLoadout = 'shareloadout',
	SavePicture = 'savepicture',
	ExportSfm = 'exportsfm',
	ExportFbx = 'exportfbx',
	Export3d = 'export3d',
	ToggleFacialPanel = 'togglefacialpanel',
	ShowBugNotification = 'showbugnotification',
	ShowAboutNotification = 'showaboutotification',
	ToggleOptionsManager = 'toggleoptionsmanager',
	SetAnimSpeed = 'setanimspeed',
	LoginPatreon = 'loginpatreon',
	SelectCharacter = 'selectcharacter',
	SelectCamera = 'selectcamera',
	ResetCamera = 'resetcamera',
	SetItemFilter = 'setitemfilter',
	ItemsLoaded = 'itemsloaded',
	ItemPinned = 'itempinned',
	FiltersUpdated = 'filtersupdated',
	ShowWeaponUnusualEffectSelector = 'showweaponunusualeffectselector',
}

export type SetBackgroundType = {
	type: BackgroundType;
	param?: string | FileList | null;
}

export type ShowBadge = {
	tier: number;
	level: number;
}


export enum ItemFilterAttribute {
	Name,
	Selected,
	Workshop,
	HideConflict,
	TournamentMedals,
	ShowMultiClass,
	ShowOneClass,
	ShowAllClass,
	DoNotFilterPerClass,
	Paintable,
	Warpaintable,
	Halloween,
	DisplayMedals,
	DisplayWeapons,
	DisplayCosmetics,
	DisplayTaunts,
	Collection,
}
export type SetItemFilter = {
	attribute: ItemFilterAttribute;
	/*'name' | 'selected' | 'workshop' | 'hideConflict' | 'tournamentMedals' | 'showMultiClass' | 'showOneClass' | 'showAllClass' | 'doNotFilterPerClass'
	| 'pinned' | 'paintable' | 'warpaintable' | 'halloween' | 'displayMedals' | 'displayWeapons' | 'displayCosmetics' | 'displayTaunts' | 'collection';*/
	value: string | boolean | undefined;
}

export type ItemPinned = {
	item: ItemTemplate;
	pinned: boolean;
}

export class Controller {
	static readonly eventTarget = new EventTarget();

	static addEventListener(type: ControllerEvent, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
		this.eventTarget.addEventListener(type, callback, options);
	}

	static dispatchEvent<T>(type: ControllerEvent, options?: CustomEventInit<T>): boolean {
		return this.eventTarget.dispatchEvent(new CustomEvent<T>(type, options));
	}

	static removeEventListener(type: ControllerEvent, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
		this.eventTarget.removeEventListener(type, callback, options);
	}
}
