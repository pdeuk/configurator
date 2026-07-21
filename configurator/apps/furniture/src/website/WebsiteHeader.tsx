import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { enableLocalDemoMode } from "../app/localDemoMode";
import { CartIcon, GlobeIcon, MenuIcon, SearchIcon } from "./icons";
import { WebsiteProductsNav } from "./WebsiteProductsNav";

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
                            style={styles.iconButton}
                            aria-label="Open products menu"
                            aria-expanded={isProductsNavOpen}
                            onClick={() => setIsProductsNavOpen(true)}
                        >
                            <MenuIcon style={styles.actionIcon} />
                        </button>

                        <div style={styles.logoSlot} aria-label="Logo placeholder">
                            <span style={styles.logoMark}>LOGO</span>
                        </div>
                    </div>

                    <label style={styles.searchWrap}>
                        <SearchIcon style={styles.searchIcon} />
                        <input
                            type="search"
                            placeholder="Search furniture, collections, materials…"
                            style={styles.searchInput}
                            aria-label="Search"
                        />
                    </label>

                    <div style={styles.actions}>
                        <button type="button" style={styles.createButton} onClick={openConfigurator}>
                            Create Furniture
                        </button>

                        <button type="button" style={styles.iconButton} aria-label="Shopping cart">
                            <CartIcon style={styles.actionIcon} />
                        </button>

                        <button type="button" style={styles.signInButton} aria-label="Sign in">
                            Sign In
                        </button>

                        <button type="button" style={styles.iconButton} aria-label="Change language">
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
        background: "#ffffff",
        borderBottom: "1px solid #e5e7eb",
        boxShadow: "0 1px 0 rgba(15, 23, 42, 0.04)"
    },
    inner: {
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr) auto",
        alignItems: "center",
        gap: 24,
        maxWidth: 1440,
        margin: "0 auto",
        padding: "16px 28px"
    },
    leftCluster: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0
    },
    logoSlot: {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 120,
        height: 44,
        borderRadius: 8,
        border: "1px dashed #cbd5e1",
        background: "#f8fafc",
        color: "#64748b",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.08em"
    },
    logoMark: {
        userSelect: "none" as const
    },
    searchWrap: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
        height: 52,
        padding: "0 18px",
        borderRadius: 999,
        border: "1px solid #d1d5db",
        background: "#f9fafb"
    },
    searchIcon: {
        width: 20,
        height: 20,
        color: "#6b7280",
        flexShrink: 0
    },
    searchInput: {
        flex: 1,
        minWidth: 0,
        border: "none",
        outline: "none",
        background: "transparent",
        color: "#111827",
        font: "inherit",
        fontSize: 16
    },
    actions: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexShrink: 0
    },
    createButton: {
        border: "none",
        borderRadius: 999,
        padding: "12px 18px",
        background: "#111827",
        color: "#ffffff",
        font: "inherit",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap" as const
    },
    iconButton: {
        display: "grid",
        placeItems: "center",
        width: 42,
        height: 42,
        borderRadius: 999,
        border: "1px solid #e5e7eb",
        background: "#ffffff",
        color: "#111827",
        cursor: "pointer"
    },
    signInButton: {
        border: "1px solid #d1d5db",
        borderRadius: 999,
        padding: "10px 16px",
        background: "#ffffff",
        color: "#111827",
        font: "inherit",
        fontSize: 14,
        fontWeight: 600,
        cursor: "pointer",
        whiteSpace: "nowrap" as const
    },
    actionIcon: {
        width: 20,
        height: 20
    }
} satisfies Record<string, import("react").CSSProperties>;
