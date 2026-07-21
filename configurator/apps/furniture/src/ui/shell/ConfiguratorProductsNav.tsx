import { useState, type CSSProperties } from "react";
import { PRODUCT_CATEGORIES } from "../../website/productNavData";
import { configuratorNavStyles as styles } from "./configuratorNavStyles";

export function ConfiguratorProductsNav() {
    const [productsOpen, setProductsOpen] = useState(true);
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});

    const toggleCategory = (categorySlug: string) => {
        setOpenCategories(current => ({
            ...current,
            [categorySlug]: !current[categorySlug]
        }));
    };

    return (
        <div style={styles.navSection}>
            <button
                type="button"
                style={styles.navTrigger}
                onClick={() => setProductsOpen(current => !current)}
                aria-expanded={productsOpen}
            >
                <span style={styles.navTriggerLabel}>Products</span>
                <span style={styles.navChevron} aria-hidden="true">
                    {productsOpen ? "▾" : "▸"}
                </span>
            </button>

            {productsOpen && (
                <div style={styles.navDropdown}>
                    <div style={styles.nestedNavList}>
                        {PRODUCT_CATEGORIES.map(category => {
                            const categoryOpen = openCategories[category.slug] ?? false;

                            return (
                                <div key={category.id} style={styles.nestedNavGroup}>
                                    <button
                                        type="button"
                                        style={styles.nestedNavTrigger}
                                        onClick={() => toggleCategory(category.slug)}
                                        aria-expanded={categoryOpen}
                                    >
                                        <span>{category.name}</span>
                                        <span style={styles.navChevron} aria-hidden="true">
                                            {categoryOpen ? "▾" : "▸"}
                                        </span>
                                    </button>
                                    {categoryOpen && (
                                        <ul style={styles.subcategoryList}>
                                            {category.subcategories.map(subcategory => (
                                                <li
                                                    key={subcategory.id}
                                                    style={styles.subcategoryItem}
                                                >
                                                    {subcategory.name}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

interface ConfiguratorSelectedProductNavProps {
    productName: string;
}

export function ConfiguratorSelectedProductNav({
    productName
}: ConfiguratorSelectedProductNavProps) {
    return (
        <div style={styles.navSection}>
            <div style={styles.selectedProductPanel}>
                <div style={styles.selectedProductLabel}>Product</div>
                <div style={styles.selectedProductValue}>→ {productName}</div>
            </div>
        </div>
    );
}
