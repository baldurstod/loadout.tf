const equipConflicts: Record<string, string[]> = {
	'glasses': ['face', 'lenses'],
	'whole_head': ['hat', 'face', 'glasses'],
}

export function hasConflict(equipRegions1: Array<string>, equipRegions2: Array<string>): boolean {
	if (!equipRegions1 || !equipRegions2) {
		return false;
	}

	for (let region1 of equipRegions1) {
		for (let region2 of equipRegions2) {

			region1 = region1.toLowerCase();
			region2 = region2.toLowerCase();
			if (region1 == region2) {
				return true;
			}

			let eq1 = equipConflicts[region1];
			let eq2 = equipConflicts[region2];
			if (eq1) {
				for (let k = 0; k < eq1.length; k++) {
					if (eq1[k] == region2) {
						return true;
					}
				}
			}

			if (eq2) {
				for (let l = 0; l < eq2.length; l++) {
					if (region1 == eq2[l]) {
						return true;
					}
				}
			}
		}
	}
	return false
}
