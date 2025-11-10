import { Techniques } from './model/enums';
import { MockupStyles } from './model/mockupstyles';
import { ProductMockupStyles } from './model/productmockupstyles';
import { fetchShopAPI } from './shop';

const mockupStyles = new Map<number, ProductMockupStyles>();

async function getMockupStyles(productId: number): Promise<ProductMockupStyles | undefined> {
	if (!mockupStyles.has(productId)) {
		const { response: json } = await fetchShopAPI('get-printful-mockup-styles', 1, { product_id: productId });
		if (json && json.success) {
			const styles = new ProductMockupStyles(productId);
			styles.fromJSON(json.result.styles);
			mockupStyles.set(productId, styles);
		}
	}

	const styles = mockupStyles.get(productId);
	if (!styles) {
		return;
	}

	return styles;
}

export async function GetMockupStyle(productId: number, variantId: number, technique: Techniques, placement: string): Promise<MockupStyles | undefined> {
	const mockupStyles = await getMockupStyles(productId);
	if (!mockupStyles) {
		return undefined;
	}

	const style = mockupStyles.getStyles({ variantId: variantId, technique: technique, placement: placement });

	// TODO: check if array only has one element
	return style[0];
}

export async function GetMockupStyles(productId: number, technique: Techniques, placement: string): Promise<MockupStyles | undefined> {
	const mockupStyles = await getMockupStyles(productId);
	if (!mockupStyles) {
		return undefined;
	}

	const styles = mockupStyles.getStyles({ technique: technique, placement: placement });

	// TODO: check if array only has one element
	return styles[0];
}
