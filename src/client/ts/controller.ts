import { BackgroundType } from "./enums";

export enum ControllerEvents {
	UseBots = 'usebots',
	ShowCompetitiveStage = 'showcompetitivestage',
	ChangeMap = 'changemap',
	InitMapList = 'initmaplist',
	ToggleVideo = 'togglevideo',
	SetBackgroundType = 'setbackgroundtype',
	OverrideTextures = 'overridetextures',
	ShowBadge = 'showbadge',
	ImportFile = 'importfile',
}

export type SetBackgroundType = {
	type: BackgroundType;
	param?: string | FileList | null;
}

export type ShowBadge = {
	tier: number;
	level: number;
}

export class Controller {
	static readonly eventTarget = new EventTarget();

	static addEventListener(type: ControllerEvents, callback: EventListenerOrEventListenerObject | null, options?: AddEventListenerOptions | boolean): void {
		this.eventTarget.addEventListener(type, callback, options);
	}

	static dispatchEvent<T>(type: ControllerEvents, options?: CustomEventInit<T>): boolean {
		return this.eventTarget.dispatchEvent(new CustomEvent<T>(type, options));
	}

	static removeEventListener(type: ControllerEvents, callback: EventListenerOrEventListenerObject | null, options?: EventListenerOptions | boolean): void {
		this.eventTarget.removeEventListener(type, callback, options);
	}
}
