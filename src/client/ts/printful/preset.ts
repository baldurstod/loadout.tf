import { Radian } from 'harmony-types';
import { isConflicting } from './catalog';
import { Pattern, Techniques } from './model/enums';

export enum PlacementSource {
	None = 'none',
	Scene = 'scene',
	Image = 'image',
}

export class ProductPreset {
	productId = -1;
	variantId = -1;
	#technique: Techniques = Techniques.Unknwown;
	#selectedPlacement = '';
	#placements = new Map<string, PlacementPreset>();

	#initPlacement(placement: string): void {
		if (!this.#placements.has(placement)) {
			this.#placements.set(placement, new PlacementPreset(placement));
		}
	}

	setTechnique(technique: Techniques): void {
		if (this.#technique == technique) {
			return;
		}
		this.#technique = technique;
		this.#placements.clear();
	}

	getTechnique(): Techniques {
		return this.#technique;
	}

	selectPlacement(placement: string): void {
		this.#selectedPlacement = placement;
		this.getSelectedPreset().setIncluded(true);
	}

	getSelectedPlacement(): string {
		return this.#selectedPlacement;
	}

	getSelectedPreset(): PlacementPreset {
		this.#initPlacement(this.#selectedPlacement);
		return this.#placements.get(this.#selectedPlacement)!;
	}

	getPreset(placement: string): PlacementPreset {
		this.#initPlacement(placement);
		return this.#placements.get(placement)!;
	}

	regenerateAllPlacements(): void {
		for (const [, placement] of this.#placements) {
			placement.regeneratePlacement();
		}
	}

	getIncludedPlacements(): PlacementPreset[] {
		const placements: PlacementPreset[] = [];

		for (const [, placement] of this.#placements) {
			if (placement.isIncluded()) {
				placements.push(placement);
			}
		}

		return placements;
	}

	async isConflictingPlacement(placement: string): Promise<boolean> {
		for (const [, placement2] of this.#placements) {
			if (placement2.isIncluded() && await isConflicting(this.productId, placement, placement2.getPlacement())) {
				return true;
			}
		}
		return false;
	}
}

export class PlacementPreset {
	#locked = false;
	#included = false;
	#dirty = true;
	#name = '';
	#placement = '';
	orientation = 'any';
	#transparent = true;
	#symmetry = false;
	#pattern: Pattern = Pattern.None;
	#scale = 1;
	#rotation: Radian = 0;
	/** Gap between two consecutive images on the horizontal axis, in relative image width. */
	#horizontalGap = 0;
	/** Gap between two consecutive images on the vertical axis, in relative image height. */
	#verticalGap = 0;
	/** Offset from the canvas center, in relative canvas width, applied before rotation. */
	#horizontalOffset = 0;
	/** Offset from the canvas center, in relative canvas height, applied before rotation. */
	#verticalOffset = 0;
	#width = 1;
	#height = 1;
	#source = PlacementSource.Scene;
	#image: HTMLImageElement | null = null;
	#printImage: HTMLImageElement | null = null;

	constructor(placement: string) {
		this.#placement = placement;
	}

	setLock(lock: boolean): void {
		this.#locked = lock;
	}

	isLocked(): boolean {
		return this.#locked;
	}

	setIncluded(included: boolean): void {
		this.#included = included && this.#source != PlacementSource.None;
	}

	isIncluded(): boolean {
		return this.#included;
	}

	isDirty(): boolean {
		return this.#dirty;
	}

	getPlacement(): string {
		return this.#placement;
	}

	setTransparent(transparent: boolean): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#transparent = transparent;
	}

	isTransparent(): boolean {
		return this.#transparent;
	}

	setSymmetry(symmetry: boolean): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#symmetry = symmetry;
	}

	getSymmetry(): boolean {
		return this.#symmetry;
	}

	setPattern(pattern: Pattern): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#pattern = pattern;
	}

	getPattern(): Pattern {
		return this.#pattern;
	}

	setScale(scale: number): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#scale = scale;
	}

	getScale(): number {
		return this.#scale;
	}

	setRotation(rotation: Radian): void {
		if (this.#locked) {
			return;
		}
		this.#rotation = rotation;
	}

	getRotation(): Radian {
		return this.#rotation;
	}

	setVerticalGap(verticalGap: number): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#verticalGap = verticalGap;
	}

	getVerticalGap(): number {
		return this.#verticalGap;
	}

	setHorizontalGap(horizontalGap: number): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#horizontalGap = horizontalGap;
	}

	getHorizontalGap(): number {
		return this.#horizontalGap;
	}

	setVerticalOffset(verticalOffset: number): void {
		if (this.#locked) {
			return;
		}
		this.#verticalOffset = verticalOffset;
	}

	getVerticalOffset(): number {
		return this.#verticalOffset;
	}

	setHorizontalOffset(horizontalOffset: number): void {
		if (this.#locked) {
			return;
		}
		this.#horizontalOffset = horizontalOffset;
	}

	getHorizontalOffset(): number {
		return this.#horizontalOffset;
	}

	setWidth(width: number): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#width = width;
	}

	getWidth(): number {
		return this.#width;
	}

	setHeight(height: number): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#height = height;
	}

	getHeight(): number {
		return this.#height;
	}

	setSource(source: PlacementSource): void {
		if (this.#locked) {
			return;
		}
		this.#source = source;
		this.setIncluded(true);
		/*
		if (source == PlacementSource.None) {
			this.setIncluded(false);
		} else {
		}
		*/
	}

	getSource(): PlacementSource {
		return this.#source;
	}

	setImage(image: HTMLImageElement): void {
		if (this.#locked) {
			return;
		}
		this.#dirty = false;
		this.#image = image;
	}

	getImage(): HTMLImageElement | null {
		return this.#image;
	}

	setPrintImage(originalImage: HTMLImageElement): void {
		this.#printImage = originalImage;
	}

	getPrintImage(): HTMLImageElement | null {
		return this.#printImage;
	}

	regeneratePlacement(): void {
		if (!this.#locked) {
			this.#dirty = true;
		}
	}
}
