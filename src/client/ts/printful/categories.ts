import { OptionsManager } from 'harmony-browser-utils';
import { JSONObject } from 'harmony-types';
import { langs } from './lang';
import { Category } from './model/category';
import { Product } from './model/product';
import { fetchShopAPI } from './shop';


export async function isParent(product: Product, parentCategoryId: number): Promise<boolean> {
	const categories = await initCategories();
	let categoryId = product.mainCategoryId;
	if (categoryId == parentCategoryId) {
		return true;
	}

	while (true) {
		const category = categories.get(categoryId);

		if (!category) {
			break;
		}

		if (category.parentId == 0) {
			break;
		}

		if (category.parentId == parentCategoryId) {
			return true;
		}

		categoryId = category.parentId;
	}

	for (const category of product.categories) {
		if (parentCategoryId == category) {
			return true;
		}
	}

	return false;
}

export async function isParentCategory(categoryId: number, parentCategoryId: number): Promise<boolean> {
	const categories = await initCategories();
	if (categoryId == parentCategoryId) {
		return true;
	}

	while (true) {
		const category = categories.get(categoryId);

		if (!category) {
			break;
		}

		if (category.parentId == 0) {
			break;
		}

		if (category.parentId == parentCategoryId) {
			return true;
		}

		categoryId = category.parentId;
	}

	return false;
}

let initCategoriesPromise: Promise<Map<number, Category>> | undefined;
export async function initCategories(): Promise<Map<number, Category>> {
	if (!initCategoriesPromise) {
		const categories = new Map<number, Category>();

		let initCategoriesPromiseResolve: (value: Map<number, Category>) => void;

		initCategoriesPromise = new Promise<Map<number, Category>>((resolve) => { initCategoriesPromiseResolve = resolve });

		const currentlang = OptionsManager.getItem('app.lang') as string;
		const language = langs.get(currentlang) ?? 'en_US';

		const { response: categoriesResponse } = await fetchShopAPI('get-printful-categories', 1, { language });

		if (categoriesResponse.success && categoriesResponse.result?.categories) {
			for (const category of categoriesResponse.result.categories as JSONObject[]) {
				const c = new Category();
				c.fromJSON(category);
				categories.set(c.id, c);
			}
		}
		initCategoriesPromiseResolve!(categories);
	}

	return initCategoriesPromise;
}

export async function getCategories(parentId?: number): Promise<Category[]> {
	const categories = await initCategories();

	const ret: Category[] = [];

	for (const [, category] of categories) {
		if (parentId == undefined || category.parentId == parentId) {
			ret.push(category);
		}
	}

	return ret;
}

export async function categoryHasProducts(category: Category, products: Set<Product>): Promise<boolean> {
	for (const product of products) {
		if (await isParent(product, category.id)) {
			return true;
		}
	}
	return false;
}

export async function categoryHasSubCategories(parentId: number): Promise<boolean> {
	const categories = await initCategories();

	for (const [, category] of categories) {
		if (category.parentId == parentId) {
			return true
		}
	}
	return false;
}
