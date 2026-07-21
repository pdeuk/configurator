import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { enableLocalDemoMode } from "../app/localDemoMode";
import { CartIcon, GlobeIcon, MenuIcon, SearchIcon } from "./icons";
import { WebsiteProductsNav } from "./WebsiteProductsNav";
import { t } from "./websiteTheme";

export function WebsiteHeader() {
    const navigate = useNavigate();
    const [isProductsNavOpen, setIsProductsNavOpen] = useState(false);

    const openConfigurator = () => {
        enableLocalDemoMode();
        navigate("/app");
    };

    return (
        <>
            <header style={styles.header}>
                <div style={styles.inner}>
                    <div style={styles.leftCluster}>
                        <button
                            type="button"
                            className="website-icon-btn"
                            aria-label="Open products menu"
                            aria-expanded={isProductsNavOpen}
                            onClick={() => setIsProductsNavOpen(true)}
                        >
                            <MenuIcon style={styles.actionIcon} />
                        </button>

                        <Link to="/" style={styles.logoLink} aria-label="Home">
                            <span style={styles.logoMark} className="website-heading">
                                Atelier
                            </span>
                            <span style={styles.logoSub}>Furniture</span>
                        </Link>
                    </div>

                    <label className="website-search" style={styles.searchWrap}>
                        <SearchIcon style={styles.searchIcon} />
                        <input
                            type="search"
                            placeholder="Search collections, materials, finishes…"
                            style={styles.searchInput}
                            aria-label="Search"
                        />
                    </label>

                    <div style={styles.actions}>
                        <button type="button" className="website-btn-primary" onClick={openConfigurator}>
                            Create Furniture
                        </button>

                        <button type="button" className="website-icon-btn" aria-label="Shopping cart">
                            <CartIcon style={styles.actionIcon} />
                        </button>

                        <button type="button" className="website-btn-secondary" aria-label="Sign in">
                            Sign In
                        </button>

                        <button type="button" className="website-icon-btn" aria-label="Change language">
                            <GlobeIcon style={styles.actionIcon} />
                        </button>
                    </div>
                </div>
            </header>

            <WebsiteProductsNav isOpen={isProductsNavOpen} onClose={() => setIsProductsNavOpen(false)} />
        </>
    );
}

const styles = {
    header: {
        position: "sticky" as const,
        top: 0,
        zIndex: 20,
        background: "rgba(247, 244, 239, 0.88)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: `1px solid ${t.colors.borderSoft}`,
        boxShadow: t.shadow.header
    },
    inner: {
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 28,
        maxWidth: 1440,
        margin: "0 auto",
        padding: "18px 32px"
    },
    leftCluster: {
        display: "flex",
        alignItems: "center",
        gap: 16,
        flexShrink: 0
    },
    logoLink: {
        display: "grid",
        gap: 2,
        textDecoration: "none",
        color: "inherit"
    },
    logoMark: {
        fontSize: 28,
        fontWeight: 600,
        lineHeight: 1,
        color: t.colors.ink
    },
    logoSub: {
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.24em",
        textTransform: "uppercase" as const,
        color: t.colors.muted
    },
    searchWrap: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
        height: 54,
        padding: "0 20px",
        borderRadius: t.radius.pill,
        border: `1px solid ${t.colors.border}`,
        background: "rgba(255, 255, 255, 0.72)"
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
    actions: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0
    },
    actionIcon: {
        width: 18,
        height: 18
    }
} satisfies Record<string, import("react").CSSProperties>;
