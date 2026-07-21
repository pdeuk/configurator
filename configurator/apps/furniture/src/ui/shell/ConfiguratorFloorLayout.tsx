import { useState, type CSSProperties, type ReactNode } from "react";
import { clientProfile } from "../../../client.config";
import { FloorControls } from "./FloorControls";

const HEADER_HEIGHT = 52;
const NAV_WIDTH = 280;

interface ConfiguratorFloorLayoutProps {
    onExit: () => void;
    children: ReactNode;
}

export function ConfiguratorFloorLayout({ onExit, children }: ConfiguratorFloorLayoutProps) {
    const [floorOpen, setFloorOpen] = useState(true);

    return (
        <div style={styles.shell}>
            <header style={styles.header}>
                <div style={styles.headerBrand}>
                    <span style={styles.headerTitle}>Atelier</span>
                    <span style={styles.headerSubtitle}>{clientProfile.branding.appName}</span>
                </div>
            </header>

            <div style={styles.body}>
                <nav style={styles.nav} aria-label="Configurator navigation">
                    <div style={styles.navSection}>
                        <button
                            type="button"
                            style={styles.navTrigger}
                            onClick={() => setFloorOpen(current => !current)}
                            aria-expanded={floorOpen}
                        >
                            <span style={styles.navTriggerLabel}>Floor</span>
                            <span style={styles.navChevron} aria-hidden="true">
                                {floorOpen ? "▾" : "▸"}
                            </span>
                        </button>
                        {floorOpen && (
                            <div style={styles.navDropdown}>
                                <FloorControls />
                            </div>
                        )}
                    </div>
                </nav>

                <main style={styles.viewport}>
                    <div style={styles.canvasHost}>{children}</div>
                    <button type="button" style={styles.exitButton} onClick={onExit}>
                        Exit
                    </button>
                </main>
            </div>
        </div>
    );
}

const styles = {
    shell: {
        display: "flex",
        flexDirection: "column",
        width: "100vw",
        height: "100vh",
        minHeight: 0,
        overflow: "hidden",
        background: "#ffffff",
        fontFamily: "system-ui, sans-serif"
    },
    header: {
        flexShrink: 0,
        height: HEADER_HEIGHT,
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        borderBottom: "1px solid #e7e5e4",
        background: "#ffffff",
        boxSizing: "border-box" as const,
        zIndex: 20
    },
    headerBrand: {
        display: "flex",
        alignItems: "baseline",
        gap: 8,
        minWidth: 0
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: "#1c1917"
    },
    headerSubtitle: {
        fontSize: 13,
        color: "#78716c"
    },
    body: {
        flex: 1,
        display: "flex",
        minHeight: 0,
        minWidth: 0
    },
    nav: {
        flexShrink: 0,
        width: NAV_WIDTH,
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid #e7e5e4",
        background: "#fafaf9",
        boxSizing: "border-box" as const,
        overflowY: "auto",
        padding: "12px 0"
    },
    navSection: {
        display: "grid"
    },
    navTrigger: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        width: "100%",
        border: "none",
        borderBottom: "1px solid #e7e5e4",
        background: "transparent",
        color: "#1c1917",
        padding: "14px 16px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 14,
        fontWeight: 600,
        textAlign: "left" as const
    },
    navTriggerLabel: {
        letterSpacing: "-0.01em"
    },
    navChevron: {
        color: "#78716c",
        fontSize: 12
    },
    navDropdown: {
        padding: "14px 16px 16px",
        borderBottom: "1px solid #e7e5e4",
        background: "#ffffff"
    },
    viewport: {
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        position: "relative",
        background: "#ffffff"
    },
    canvasHost: {
        position: "absolute",
        inset: 0
    },
    exitButton: {
        position: "absolute",
        right: 24,
        bottom: 24,
        zIndex: 12,
        border: "1px solid #d6d3d1",
        background: "#ffffff",
        color: "#1c1917",
        borderRadius: 8,
        padding: "10px 18px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        fontWeight: 600,
        boxShadow: "0 8px 24px rgba(28, 25, 23, 0.08)"
    }
} satisfies Record<string, CSSProperties>;
