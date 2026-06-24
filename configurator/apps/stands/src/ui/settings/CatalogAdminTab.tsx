import { useEffect, useState } from "react";
import {
    DEFAULT_CATALOG_CATEGORIES,
    DEFAULT_CATALOG_THUMBNAIL,
    deleteCatalogItem,
    formatCatalogDimensions,
    getCatalogCategoryName,
    listCatalogItems,
    type CatalogItem
} from "../../services/catalog";

export function CatalogAdminTab() {
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadItems = async () => {
        setIsLoading(true);
        setError(null);

        try {
            setItems(await listCatalogItems());
        } catch (loadError) {
            console.warn("Admin catalog load failed.", loadError);
            setError("Unable to load component catalog.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadItems();
    }, []);

    const handleDelete = async (item: CatalogItem) => {
        const confirmed = window.confirm(`Delete component "${item.name}"?`);

        if (!confirmed) {
            return;
        }

        try {
            await deleteCatalogItem(item.id);
            await loadItems();
        } catch (deleteError) {
            console.warn("Admin catalog delete failed.", deleteError);
            setError("Unable to delete component.");
        }
    };

    if (isLoading) {
        return <p style={styles.empty}>Loading component catalog…</p>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h3 style={styles.title}>Component Catalog</h3>
                    <p style={styles.subtitle}>
                        Organization reusable modules. Save selected modules from the Component Library panel in the editor.
                    </p>
                </div>
                <button type="button" style={styles.button} onClick={() => void loadItems()}>
                    Refresh
                </button>
            </div>

            {items.length === 0 ? (
                <p style={styles.empty}>No saved components yet.</p>
            ) : (
                <div style={styles.grid}>
                    {items.map(item => (
                        <article key={item.id} style={styles.card}>
                            <img
                                style={styles.thumbnail}
                                src={item.thumbnail ?? DEFAULT_CATALOG_THUMBNAIL}
                                alt=""
                            />
                            <div style={styles.cardBody}>
                                <div style={styles.cardTitle}>{item.name}</div>
                                <div style={styles.cardMeta}>
                                    {getCatalogCategoryName(item.category)}
                                    · {formatCatalogDimensions(item.defaultDimensions)}
                                </div>
                                {item.defaultPriceItemId && (
                                    <div style={styles.priceRef}>
                                        Price ref: {item.defaultPriceItemId}
                                    </div>
                                )}
                                <button
                                    type="button"
                                    style={styles.dangerButton}
                                    onClick={() => void handleDelete(item)}
                                >
                                    Delete
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            <div style={styles.categoryList}>
                <span style={styles.categoryLabel}>Categories</span>
                {DEFAULT_CATALOG_CATEGORIES.map(category => (
                    <span key={category.id} style={styles.categoryChip}>
                        {category.name}
                    </span>
                ))}
            </div>

            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    container: {
        display: "grid",
        gap: 12
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12
    },
    title: {
        margin: 0,
        fontSize: 14
    },
    subtitle: {
        margin: "4px 0 0",
        fontSize: 12,
        color: "#9aa3b2"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 10
    },
    card: {
        border: "1px solid #3b414a",
        borderRadius: 8,
        overflow: "hidden",
        background: "#171b21"
    },
    thumbnail: {
        width: "100%",
        aspectRatio: "4 / 3",
        objectFit: "cover" as const,
        display: "block",
        background: "#252932"
    },
    cardBody: {
        padding: 10,
        display: "grid",
        gap: 6
    },
    cardTitle: {
        fontSize: 13,
        fontWeight: 600
    },
    cardMeta: {
        fontSize: 11,
        color: "#9aa3b2"
    },
    priceRef: {
        fontSize: 11,
        color: "#cbd5e1"
    },
    categoryList: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap" as const,
        alignItems: "center"
    },
    categoryLabel: {
        fontSize: 11,
        color: "#9aa3b2",
        marginRight: 4
    },
    categoryChip: {
        fontSize: 11,
        padding: "4px 8px",
        borderRadius: 999,
        border: "1px solid #3b414a",
        background: "#252932"
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    dangerButton: {
        justifySelf: "start",
        border: "1px solid #7a4048",
        background: "#4a2b31",
        color: "#ffd9de",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    empty: {
        margin: 0,
        color: "#9aa3b2",
        fontSize: 13
    },
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 12
    }
};
