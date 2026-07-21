import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDownIcon, CloseIcon } from "./icons";
import { PRODUCT_CATEGORIES } from "./productNavData";
import { displayTitleStyle, t } from "./websiteTheme";

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
                    <div style={styles.panelHeading}>
                        <span className="website-eyebrow">Browse</span>
                        <h2 className="website-heading" style={displayTitleStyle("2rem")}>
                            Products
                        </h2>
                    </div>
                    <button type="button" className="website-icon-btn" aria-label="Close menu" onClick={onClose}>
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
                                        className="website-nav-link"
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
                                                    className="website-subnav-link"
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
        background: t.colors.overlay,
        cursor: "pointer"
    },
    panel: {
        position: "relative" as const,
        zIndex: 1,
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        width: "min(380px, 88vw)",
        height: "100%",
        background: t.colors.bgElevated,
        boxShadow: t.shadow.lg
    },
    panelHeader: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
        padding: "28px 24px 18px",
        borderBottom: `1px solid ${t.colors.borderSoft}`
    },
    panelHeading: {
        display: "grid",
        gap: 8
    },
    closeIcon: {
        width: 18,
        height: 18
    },
    navList: {
        display: "grid",
        alignContent: "start",
        gap: 4,
        padding: "12px 0 28px",
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
        padding: "0 10px 0 14px"
    },
    categoryButton: {
        display: "block",
        color: t.colors.ink,
        fontFamily: t.fonts.heading,
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        textAlign: "left" as const,
        padding: "12px 10px",
        borderRadius: t.radius.sm,
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
        color: t.colors.muted,
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
        padding: "0 0 10px 18px",
        display: "grid",
        gap: 2
    },
    subcategoryButton: {
        display: "block",
        width: "100%",
        color: t.colors.inkSoft,
        fontFamily: "inherit",
        fontSize: 15,
        textAlign: "left" as const,
        padding: "10px 12px",
        borderRadius: 10,
        cursor: "pointer",
        textDecoration: "none"
    }
} satisfies Record<string, import("react").CSSProperties>;
