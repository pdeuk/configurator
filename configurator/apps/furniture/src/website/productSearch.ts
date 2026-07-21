import {
    PRODUCT_CATEGORIES,
    type ProductCategory,
    type ProductItem,
    type ProductSubcategory
} from "./productNavData";

export interface ProductSearchResult {
    product: ProductItem;
    category: ProductCategory;
    subcategory: ProductSubcategory;
    href: string;
}

export function searchProducts(query: string, limit = 8): ProductSearchResult[] {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
        return [];
    }

    const results: ProductSearchResult[] = [];

    for (const category of PRODUCT_CATEGORIES) {
        for (const subcategory of category.subcategories) {
            for (const product of subcategory.products) {
                const searchableText = [
                    product.name,
                    product.shortDescription,
                    subcategory.name,
                    category.name
                ]
                    .join(" ")
                    .toLowerCase();

                if (!searchableText.includes(normalizedQuery)) {
                    continue;
                }

                results.push({
                    product,
                    category,
                    subcategory,
                    href: `/products/${category.slug}/${subcategory.slug}/${product.slug}`
                });
            }
        }
    }

    return results.slice(0, limit);
}
