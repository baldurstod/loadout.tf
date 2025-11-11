

export function formatPrice(price: number, currency = 'USD'): string {
	return Number(price).toLocaleString(undefined, { style: 'currency', currency: currency });
}
