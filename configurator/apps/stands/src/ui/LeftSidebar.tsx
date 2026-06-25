import { type CSSProperties } from "react";
import { MockupPanel } from "./MockupPanel";
import { Toolbar } from "./Toolbar";
import {
    CHROME_ROW_TOP,
    PANEL_INSET,
    PANEL_SECTION_GAP,
    SIDEBAR_PANEL_WIDTH
} from "./shell/layout";

export function LeftSidebar() {
    return (
        <div style={styles.sidebar}>
            <Toolbar />
            <MockupPanel />
        </div>
    );
}

const styles = {
    sidebar: {
        position: "absolute",
        top: CHROME_ROW_TOP,
        left: PANEL_INSET,
        bottom: PANEL_INSET,
        width: `min(${SIDEBAR_PANEL_WIDTH}px, calc(100vw - ${PANEL_INSET * 2}px))`,
        display: "flex",
        flexDirection: "column",
        gap: PANEL_SECTION_GAP,        zIndex: 10,
        minHeight: 0,
        minWidth: 0,
        boxSizing: "border-box",
        overflowY: "auto"
    },
    toggle: {
        flexShrink: 0,
        border: "1px solid #4b5562",
        background: "#252932",
        color: "#cbd5e1",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        textAlign: "left"
    }
} satisfies Record<string, CSSProperties>;
