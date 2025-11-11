export type createProductRequest = {
	product: {
		product_id: number,
		variant_id: number,
		technique: string,
		//name: string,
		placements: createProductRequestPlacement[],
	}
}

export type createProductRequestPlacement = {
	placement: string,
	technique: string,
	image: string,
	orientation: string | 'any',
}
