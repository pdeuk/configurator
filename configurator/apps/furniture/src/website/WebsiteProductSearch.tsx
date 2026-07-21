import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { SearchIcon } from "./icons";
import { searchProducts } from "./productSearch";
import { WebsiteAssetImage } from "./WebsiteAssetImage";
import { productHeroPath, productHeroSeed } from "./websiteAssets";
import { t } from "./websiteTheme";

export function WebsiteProductSearch() {
    const listboxId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const results = useMemo(() => searchProducts(query), [query]);
    const showDropdown = isOpen && query.trim().length > 0;

    useEffect(() => {
        if (!showDropdown) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (containerRef.current?.contains(event.target as Node)) {
                return;
            }

            setIsOpen(false);
        };

        window.addEventListener("mousedown", handlePointerDown);

        return () => {
            window.removeEventListener("mousedown", handlePointerDown);
        };
    }, [showDropdown]);

    const handleSelect = () => {
        setQuery("");
        setIsOpen(false);
    };

    return (
        <div ref={containerRef} style={styles.root}>
            <label className="website-search" style={styles.searchWrap}>
                <SearchIcon style={styles.searchIcon} />
                <input
                    type="search"
                    placeholder="Search products, collections, categories…"
                    style={styles.searchInput}
                    aria-label="Search products"
                    aria-expanded={showDropdown}
                    aria-controls={showDropdown ? listboxId : undefined}
                    aria-autocomplete="list"
                    role="combobox"
                    value={query}
                    onChange={event => {
                        setQuery(event.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={event => {
                        if (event.key === "Escape") {
                            setIsOpen(false);
                        }
                    }}
                />
            </label>

            {showDropdown && (
                <div style={styles.dropdown} role="listbox" id={listboxId}>
                    {results.length === 0 ? (
                        <div style={styles.emptyState}>No matching products found.</div>
                    ) : (
                        results.map(result => (
                            <Link
                                key={result.product.id}
                                to={result.href}
                                className="website-search-result"
                                style={styles.resultLink}
                                role="option"
                                onClick={handleSelect}
                            >
                                <div style={styles.resultThumb}>
                                    <WebsiteAssetImage
                                        localSrc={productHeroPath(
                                            result.category.slug,
                                            result.subcategory.slug,
                                            result.product.slug
                                        )}
                                        seed={productHeroSeed(
                                            result.category.slug,
                                            result.subcategory.slug,
                                            result.product.slug
                                        )}
                                        alt={result.product.name}
                                        width={160}
                                        height={160}
                                    />
                                </div>
                                <div style={styles.resultCopy}>
                                    <span style={styles.resultName}>{result.product.name}</span>
                                    <span style={styles.resultMeta}>
                                        {result.category.name} · {result.subcategory.name}
                                    </span>
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    root: {
        position: "relative" as const,
        minWidth: 0
    },
    searchWrap: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
        height: 54,
        padding: "0 20px",
        borderRadius: t.radius.md,
        border: `1px solid ${t.colors.border}`,
        background: t.colors.surface
    },
    searchIcon: {
        width: 18,
        height: 18,
        color: t.colors.muted,
        flexShrink: 0
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        color: t.colors.ink,
        font: "inherit",
        fontSize: 15
    },
    dropdown: {
        position: "absolute" as const,
        top: "calc(100% + 8px)",
        left: 0,
        right: 0,
        zIndex: 30,
        display: "grid",
        gap: 4,
        padding: 8,
        borderRadius: t.radius.md,
        border: `1px solid ${t.colors.borderSoft}`,
        background: "#ffffff",
        boxShadow: t.shadow.md,
        maxHeight: 360,
        overflowY: "auto" as const
    },
    resultLink: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 12px",
        borderRadius: 10,
        textDecoration: "none",
        color: t.colors.ink
    },
    resultThumb: {
        flexShrink: 0,
        width: 52,
        height: 52,
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${t.colors.borderSoft}`,
        background: t.colors.bg
    },
    resultCopy: {
        display: "grid",
        gap: 4,
        minWidth: 0
    },
    resultName: {
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        lineHeight: 1.3
    },
    resultMeta: {
        fontSize: 12,
        color: t.colors.muted,
        lineHeight: 1.4
    },
    emptyState: {
        padding: "14px 16px",
        fontSize: 14,
        color: t.colors.muted
    }
} satisfies Record<string, import("react").CSSProperties>;
