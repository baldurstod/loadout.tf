

export function formatPrice(price: number, currency = 'USD') {
	return Number(price).toLocaleString(undefined, { style: 'currency', currency: currency });
}
