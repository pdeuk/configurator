import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon, CloseIcon } from "./icons";
import { PRODUCT_CATEGORIES } from "./productNavData";

interface WebsiteProductsNavProps {
    isOpen: boolean;
    onClose: () => void;
}

export function WebsiteProductsNav({ isOpen, onClose }: WebsiteProductsNavProps) {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setExpandedId(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    const toggleCategory = (categoryId: string) => {
        setExpandedId(current => (current === categoryId ? null : categoryId));
    };

    return (
        <div style={styles.root}>
            <button type="button" style={styles.backdrop} aria-label="Close products menu" onClick={onClose} />
            <aside style={styles.panel} aria-label="Products navigation">
                <div style={styles.panelHeader}>
                    <h2 style={styles.panelTitle}>Products</h2>
                    <button type="button" style={styles.closeButton} aria-label="Close menu" onClick={onClose}>
                        <CloseIcon style={styles.closeIcon} />
                    </button>
                </div>

                <nav style={styles.navList}>
                    {PRODUCT_CATEGORIES.map(category => {
                        const isExpanded = expandedId === category.id;

                        return (
                            <div key={category.id} style={styles.navItem}>
                                <div style={styles.navRow}>
                                    <Link
                                        to={`/products/${category.slug}`}
                                        style={styles.categoryButton}
                                        onClick={onClose}
                                    >
                                        {category.name}
                                    </Link>
                                    <button
                                        type="button"
                                        style={{
                                            ...styles.expandButton,
                                            ...(isExpanded ? styles.expandButtonOpen : {})
                                        }}
                                        aria-label={`${isExpanded ? "Collapse" : "Expand"} ${category.name}`}
                                        aria-expanded={isExpanded}
                                        onClick={() => toggleCategory(category.id)}
                                    >
                                        <ChevronDownIcon style={styles.expandIcon} />
                                    </button>
                                </div>

                                {isExpanded ? (
                                    <ul style={styles.subcategoryList}>
                                        {category.subcategories.map(subcategory => (
                                            <li key={subcategory.id}>
                                                <Link
                                                    to={`/products/${category.slug}/${subcategory.slug}`}
                                                    style={styles.subcategoryButton}
                                                    onClick={onClose}
                                                >
                                                    {subcategory.name}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                ) : null}
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </div>
    );
}

const styles = {
    root: {
        position: "fixed" as const,
        inset: 0,
        zIndex: 40
    },
    backdrop: {
        position: "absolute" as const,
        inset: 0,
        border: "none",
        background: "rgba(15, 23, 42, 0.42)",
        cursor: "pointer"
    },
    panel: {
        position: "relative" as const,
        zIndex: 1,
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        width: "min(360px, 88vw)",
        height: "100%",
        background: "#ffffff",
        boxShadow: "12px 0 40px rgba(15, 23, 42, 0.18)"
    },
    panelHeader: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "20px 20px 16px",
        borderBottom: "1px solid #e5e7eb"
    },
    panelTitle: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        color: "#111827"
    },
    closeButton: {
        display: "grid",
        placeItems: "center",
        width: 38,
        height: 38,
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111827",
        cursor: "pointer"
    },
    closeIcon: {
        width: 18,
        height: 18
    },
    navList: {
        display: "grid",
        alignContent: "start",
        gap: 2,
        padding: "8px 0 24px",
        overflowY: "auto" as const
    },
    navItem: {
        display: "grid"
    },
    navRow: {
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 4,
        padding: "0 8px 0 12px"
    },
    categoryButton: {
        display: "block",
        color: "#111827",
        fontFamily: "inherit",
        fontSize: 16,
        fontWeight: 600,
        textAlign: "left" as const,
        padding: "12px 8px",
        cursor: "pointer",
        textDecoration: "none"
    },
    expandButton: {
        display: "grid",
        placeItems: "center",
        width: 36,
        height: 36,
        borderRadius: 999,
        border: "none",
        background: "transparent",
        color: "#64748b",
        cursor: "pointer",
        transition: "transform 180ms ease"
    },
    expandButtonOpen: {
        transform: "rotate(180deg)"
    },
    expandIcon: {
        width: 18,
        height: 18
    },
    subcategoryList: {
        listStyle: "none",
        margin: 0,
        padding: "0 0 8px 20px",
        display: "grid",
        gap: 2
    },
    subcategoryButton: {
        display: "block",
        width: "100%",
        color: "#475569",
        fontFamily: "inherit",
        fontSize: 15,
        textAlign: "left" as const,
        padding: "10px 12px",
        borderRadius: 8,
        cursor: "pointer",
        textDecoration: "none"
    }
} satisfies Record<string, import("react").CSSProperties>;
