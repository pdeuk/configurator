import type { CSSProperties } from "react";
import { MockupPanel } from "./MockupPanel";
import { Toolbar } from "./Toolbar";

const PANEL_INSET = 20;

export function LeftSidebar() {
    return (
        <div style={styles.sidebar}>
            <div style={styles.toolbarSlot}>
                <Toolbar />
            </div>
            <MockupPanel />
        </div>
    );
}

const styles = {
    sidebar: {
        position: "absolute",
        top: PANEL_INSET,
        left: PANEL_INSET,
        bottom: PANEL_INSET,
        width: `min(280px, calc(100vw - ${PANEL_INSET * 2}px))`,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        zIndex: 10,
        minHeight: 0,
        minWidth: 0,
        boxSizing: "border-box"
    },
    toolbarSlot: {
        flexShrink: 0,
        minWidth: 0
    }
} satisfies Record<string, CSSProperties>;
