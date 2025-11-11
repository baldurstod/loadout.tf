import { JSONObject } from 'harmony-types';
import { AdditionalPlacements } from './model/additionalplacements';
import { Category } from './model/category';
import { Product } from './model/product';
import { ProductPlacement } from './model/productplacement';
import { ProductPrices } from './model/productprices';
import { Technique } from './model/technique';
import { Variant } from './model/variant';
import { fetchShopAPI } from './shop';
import { formatPrice } from './utils';

/*#productId: number = -1;
#variantId: number = -1;
#technique: Technique = Technique.Unknwown;
#placement: string = 'default';*/
const products = new Map<number, Product>();
const variants = new Map<number, Variant>();
const prices = new Map<number, Map<string, ProductPrices>>();
const categories = new Map<number, Category>();
//const variantsProducts = new Map<number, number>();
const variantPrices = new Map<string, Map<number, Map<string, string>>>();

const currency = 'USD';

let readyPromiseResolve!: (value: boolean) => void;
const ready = new Promise<boolean>(resolve => readyPromiseResolve = resolve);
let productInizialized = false;
let categoriestInizialized = false;

export async function initProducts(region = 'US'): Promise<void> {
	if (productInizialized) {
		return;
	}

	productInizialized = true;
	const { response: productsResponse } = await fetchShopAPI('get-printful-products', 1, {
		currency: currency,
	});
	//const { response: availableProductsResponse } = await FetchAPI('available-products', 1, { region: region });

	if (productsResponse.success/* && availableProductsResponse.success*/) {
		for (const product of productsResponse.result.products as JSONObject[]) {
			const p = new Product();
			p.fromJSON(product);
			products.set(product.id as number, p);
		}

		if (productsResponse.result.prices) {
			for (const variant of productsResponse.result.prices as JSONObject[]) {
				setVariantPrice(currency, variant.id as number, variant.technique as string, variant.price as string);
			}
		}

		/*
		const variants = productsResponse.result.variants;
		for (let variantId in variants) {
			variantsProducts.set(Number(variantId), variants[variantId]);
		}
		*/
		readyPromiseResolve(true);
	}
}

function productsReady(): Promise<boolean> {
	return ready;
}

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

export async function getAvailableProducts(categoryId = 0): Promise<Product[]> {
	if (categoryId != 0) {
		await initCategories();
	}

	await productsReady();
	const availableProducts: Product[] = [];

	for (const [id, product] of products) {
		if (id == 0 ||
			product.isDiscontinued ||
			product.catalogVariantIds.length == 0
		) {
			continue;
		}

		if (product.getTechniques().length == 0) {
			continue;
		}

		if (categoryId == 0 || isParent(product, categoryId)) {
			availableProducts.push(product);
		}
	}

	return availableProducts;
}

export async function getProduct(id: number): Promise<Product | null> {
	await productsReady();
	return products.get(id) ?? null;
}

export async function getProductVariants(productId: number): Promise<Variant[]> {
	await productsReady();
	//return products.get(id);
	const variants: Variant[] = [];
	const product = products.get(productId);
	if (!product) {
		console.error(`product not found ${productId}`);
		return variants;
	}

	for (const variantId of (product.catalogVariantIds)) {
		const variant = await getVariant(variantId);
		if (variant) {
			variants.push(variant);
		}
	}
	return variants;
}

export async function getVariant(id: number): Promise<Variant | null> {
	await productsReady();

	if (!variants.get(id)) {
		await initVariant(id);
	}

	return variants.get(id) ?? null;
}

function variantIdToProductId(variantId: number): number {
	for (const [, product] of products) {
		if (product.catalogVariantIds) {
			for (const id of product.catalogVariantIds) {
				if (id === variantId) {
					return product.id;
				}
			}
		}
	}
	return -1;
}

async function initVariant(id: number): Promise<void> {
	const productId = variantIdToProductId(id);

	if (productId == -1) {
		console.error(`product not found for variant ${id}`);
		return;
	}

	const { response: productResponse } = await fetchShopAPI('get-printful-product', 1, { 'product_id': productId });

	if (!productResponse.success) {
		console.error(`fetch get-product failed for product ${productId}`);
		return;
	}

	//	console.error(productsResponse);
	const v = productResponse.result.variants ?? [];
	for (const variant of v as JSONObject[]) {
		const va = new Variant();
		va.fromJSON(variant);
		variants.set(va.id, va);
	}
}

export async function getTechniques(productId: number): Promise<Set<Technique>> {
	const techniques = new Set<Technique>();
	const product = await getProduct(productId);
	if (!product) {
		return techniques;
	}

	for (const technique of product.getTechniques()) {
		techniques.add(technique);
	}

	return techniques;
}

export async function getPlacements(productId: number, technique: string): Promise<ProductPlacement[]> {
	const placements = new Array<ProductPlacement>();
	const product = await getProduct(productId);
	if (!product) {
		return placements;
	}

	return product.getPlacements(technique);
}

export async function getProductPrices(productId: number): Promise<ProductPrices | null> {
	await productsReady();

	if (!prices.get(productId)?.get(currency)) {
		await initProductPrices(productId);
	}

	return prices.get(productId)?.get(currency) ?? null;
}

export async function getPlacementsPrices(productId: number, technique: string, placements: Set<string>): Promise<Map<string, number>> {
	await productsReady();

	if (!prices.get(productId)?.get(currency)) {
		await initProductPrices(productId);
	}

	const placementsPrices = new Map<string, number>();
	const productPrices = prices.get(productId)?.get(currency);
	if (!productPrices) {
		return placementsPrices;
	}

	// Populate the prices
	for (const placementPrice of productPrices.product.placements) {
		if (placementPrice.techniqueKey == technique && placements.has(placementPrice.id)) {
			placementsPrices.set(placementPrice.id, Number(placementPrice.price));
		}
	}

	// Find highest price
	let maxPrice = 0;
	let maxPricePlacement = '';
	for (const [placement, price] of placementsPrices) {
		if (price > maxPrice) {
			maxPrice = price;
			maxPricePlacement = placement;
		}
	}

	if (maxPricePlacement) {
		placementsPrices.set(maxPricePlacement, 0);
	}

	return placementsPrices;
}

async function initProductPrices(productId: number): Promise<void> {
	const { response: productResponse } = await fetchShopAPI('get-printful-product-prices', 1, { 'product_id': productId, currency: currency });

	if (!productResponse.success) {
		console.error(`fetch get-product failed for product ${productId}`);
		return;
	}

	const p = new ProductPrices();
	p.fromJSON(productResponse.result.prices as JSONObject);

	if (!prices.has(productId)) {
		prices.set(productId, new Map());
	}

	prices.get(productId)!.set(currency, p);
}


export async function GetPlacementPrice(productId: number, technique: string, placement: string): Promise<AdditionalPlacements | null> {
	const productPrices = await getProductPrices(productId);

	if (!productPrices) {
		return null;
	}

	return productPrices.getPlacementPrice(technique, placement);
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

export function categoryHasProducts(category: Category, products: Product[]): boolean {
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


export async function isConflicting(productID: number, placement1: string, placement2: string): Promise<boolean> {
	const product = await getProduct(productID);
	if (!product) {
		return true;
	}

	const placements = product.getPlacements();
	for (const placement of placements) {
		if (placement.getPlacement() == placement1) {
			if (placement.isConflicting(placement2)) {
				return true;
			}
		}
	}
	return false;
}


function setVariantPrice(currency: string, id: number, technique: string, price: string): void {
	let c = variantPrices.get(currency);
	if (!c) {
		c = new Map();
		variantPrices.set(currency, c);
	}

	let i = c.get(id);
	if (!i) {
		i = new Map();
		c.set(id, i);
	}

	const t = i.get(technique);
	if (!t) {
		i.set(technique, price);
	}
}

function getVariantPrices(currency: string, id: number): Map<string, string> | null {
	return variantPrices.get(currency)?.get(id) ?? null;
}

export async function getProductPrice(productID: number): Promise<string> {
	await productsReady();
	const product = products.get(productID);
	if (!product) {
		return '';
	}

	let minPrice = Infinity;
	let maxPrice = 0;

	for (const variantID of product.catalogVariantIds) {
		const variantPrice = getVariantPrices(currency, variantID);
		if (variantPrice) {
			for (const [, price] of variantPrice) {
				const p = Number(price);
				if (!isNaN(p)) {
					minPrice = Math.min(minPrice, p);
					maxPrice = Math.max(maxPrice, p);
				}
			}
		}
	}
	return formatPrice(minPrice, currency);
}
