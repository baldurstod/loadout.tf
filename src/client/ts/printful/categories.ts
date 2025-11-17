import { JSONObject } from 'harmony-types';
import { Category } from './model/category';
import { Product } from './model/product';
import { fetchShopAPI } from './shop';

const categories = new Map<number, Category>();
let categoriestInizialized = false;

export function isParent(product: Product, parentCategoryId: number): boolean {
	let categoryId = product.mainCategoryId;
	if (categoryId == parentCategoryId) {
		return true;
	}

	while (true) {
		const category = categories.get(categoryId);

		if (!category) {
			return false;
		}

		if (category.parentId == 0) {
			return false;
		}

		if (category.parentId == parentCategoryId) {
			return true;
		}

		categoryId = category.parentId;
	}
}


export async function initCategories(): Promise<void> {
	if (categoriestInizialized) {
		return;
	}

	categoriestInizialized = true;
	const { response: categoriesResponse } = await fetchShopAPI('get-printful-categories', 1);

	if (categoriesResponse.success && categoriesResponse.result?.categories) {
		for (const category of categoriesResponse.result.categories as JSONObject[]) {
			const c = new Category();
			c.fromJSON(category);
			categories.set(c.id, c);
		}
	}
}

export async function getCategories(parentId?: number): Promise<Category[]> {
	await initCategories();

	const ret: Category[] = [];

	for (const [, category] of categories) {
		if (parentId == undefined || category.parentId == parentId) {
			ret.push(category);
		}
	}

	return ret;
}

export function categoryHasProducts(category: Category, products: Set<Product>): boolean {
	for (const product of products) {
		if (isParent(product, category.id)) {
			return true;
		}
	}
	return false;
}

export async function categoryHasSubCategories(parentId: number): Promise<boolean> {
	await initCategories();

	for (const [, category] of categories) {
		if (category.parentId == parentId) {
			return true
		}
	}
	return false;
}
