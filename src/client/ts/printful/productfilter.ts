import { ProductFilterAttribute } from '../controller';
import { isParent } from './categories';
import { Product } from './model/product';

export enum ProductFilterResult {
	Ok,
	ExcludedFilter,
}

export class ProductFilter {
	name?: string;

	matchFilter(product: Product, categoryId = 0): ProductFilterResult {
		if (product.id == 0 ||
			product.isDiscontinued ||
			product.catalogVariantIds.length == 0
		) {
			return ProductFilterResult.ExcludedFilter;
		}

		if (product.getTechniques().length == 0) {
			return ProductFilterResult.ExcludedFilter;
		}

		if (categoryId != 0 && !isParent(product, categoryId)) {
			return ProductFilterResult.ExcludedFilter;
		}

		return ProductFilterResult.Ok;
	}

	setAttribute(attribute: ProductFilterAttribute, value: boolean | string | undefined): void {
		switch (attribute) {
			case ProductFilterAttribute.Name:
				this.name = value as string;
				break;
			default:
				throw new Error('unknown attribute ' + String(attribute));
		}
	}
}
