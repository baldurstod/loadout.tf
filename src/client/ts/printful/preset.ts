import { Radian } from 'harmony-types';
import { isConflicting } from './catalog';
import { Pattern, Techniques } from './model/enums';

export enum PlacementSource {
	None = 'none',
	Scene = 'scene',
	Image = 'image',
}

export class ProductPreset {
	productId: number = -1;
	variantId: number = -1;
	#technique: Techniques = Techniques.Unknwown;
	#selectedPlacement: string = '';
	#placements: Map<string, PlacementPreset> = new Map();

	#initPlacement(placement: string) {
		if (!this.#placements.has(placement)) {
			this.#placements.set(placement, new PlacementPreset(placement));
		}
	}

	setTechnique(technique: Techniques) {
		if (this.#technique == technique) {
			return;
		}
		this.#technique = technique;
		this.#placements.clear();
	}

	getTechnique(): Techniques {
		return this.#technique;
	}

	selectPlacement(placement: string) {
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

	regenerateAllPlacements() {
		for (const [_, placement] of this.#placements) {
			placement.regeneratePlacement();
		}
	}

	getIncludedPlacements(): Array<PlacementPreset> {
		const placements: Array<PlacementPreset> = [];

		for (const [_, placement] of this.#placements) {
			if (placement.isIncluded()) {
				placements.push(placement);
			}
		}

		return placements;
	}

	async isConflictingPlacement(placement: string) {
		for (const [_, placement2] of this.#placements) {
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
	#name: string = '';
	#placement: string = '';
	orientation: string = 'any';
	#transparent: boolean = true;
	#symmetry: boolean = false;
	#pattern: Pattern = Pattern.None;
	#scale: number = 1;
	#rotation: Radian = 0;
	/** Gap between two consecutive images on the horizontal axis, in relative image width. */
	#horizontalGap: number = 0;
	/** Gap between two consecutive images on the vertical axis, in relative image height. */
	#verticalGap: number = 0;
	/** Offset from the canvas center, in relative canvas width, applied before rotation. */
	#horizontalOffset: number = 0;
	/** Offset from the canvas center, in relative canvas height, applied before rotation. */
	#verticalOffset: number = 0;
	#width: number = 1;
	#height: number = 1;
	#source = PlacementSource.Scene;
	#image: HTMLImageElement | null = null;
	#printImage: HTMLImageElement | null = null;

	constructor(placement: string) {
		this.#placement = placement;
	}

	setLock(lock: boolean) {
		this.#locked = lock;
	}

	isLocked() {
		return this.#locked;
	}

	setIncluded(included: boolean) {
		this.#included = included && this.#source != PlacementSource.None;
	}

	isIncluded() {
		return this.#included;
	}

	isDirty() {
		return this.#dirty;
	}

	getPlacement() {
		return this.#placement;
	}

	setTransparent(transparent: boolean) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#transparent = transparent;
	}

	isTransparent() {
		return this.#transparent;
	}

	setSymmetry(symmetry: boolean) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#symmetry = symmetry;
	}

	getSymmetry() {
		return this.#symmetry;
	}

	setPattern(pattern: Pattern) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#pattern = pattern;
	}

	getPattern() {
		return this.#pattern;
	}

	setScale(scale: number) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#scale = scale;
	}

	getScale() {
		return this.#scale;
	}

	setRotation(rotation: Radian) {
		if (this.#locked) {
			return;
		}
		this.#rotation = rotation;
	}

	getRotation(): Radian {
		return this.#rotation;
	}

	setVerticalGap(verticalGap: number) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#verticalGap = verticalGap;
	}

	getVerticalGap() {
		return this.#verticalGap;
	}

	setHorizontalGap(horizontalGap: number) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#horizontalGap = horizontalGap;
	}

	getHorizontalGap() {
		return this.#horizontalGap;
	}

	setVerticalOffset(verticalOffset: number) {
		if (this.#locked) {
			return;
		}
		this.#verticalOffset = verticalOffset;
	}

	getVerticalOffset() {
		return this.#verticalOffset;
	}

	setHorizontalOffset(horizontalOffset: number) {
		if (this.#locked) {
			return;
		}
		this.#horizontalOffset = horizontalOffset;
	}

	getHorizontalOffset() {
		return this.#horizontalOffset;
	}

	setWidth(width: number) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#width = width;
	}

	getWidth() {
		return this.#width;
	}

	setHeight(height: number) {
		if (this.#locked) {
			return;
		}
		this.#dirty = true;
		this.#height = height;
	}

	getHeight() {
		return this.#height;
	}

	setSource(source: PlacementSource) {
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

	getSource() {
		return this.#source;
	}

	setImage(image: HTMLImageElement) {
		if (this.#locked) {
			return;
		}
		this.#dirty = false;
		this.#image = image;
	}

	getImage() {
		return this.#image;
	}

	setPrintImage(originalImage: HTMLImageElement) {
		this.#printImage = originalImage;
	}

	getPrintImage(): HTMLImageElement | null {
		return this.#printImage;
	}

	regeneratePlacement() {
		if (!this.#locked) {
			this.#dirty = true;
		}
	}
}
