import type { CSSProperties, ReactNode } from "react";
import {
    PANEL_INSET,
    PANEL_SECTION_GAP,
    RIGHT_PANEL_WIDTH,
    TOP_CONTENT_OFFSET
} from "./layout";

interface RightPanelColumnProps {
    children: ReactNode;
}

export function RightPanelColumn({ children }: RightPanelColumnProps) {
    return <div style={styles.column}>{children}</div>;
}

const styles = {
    column: {
        position: "absolute",
        top: TOP_CONTENT_OFFSET,
        right: PANEL_INSET,
        bottom: PANEL_INSET,
        width: `min(${RIGHT_PANEL_WIDTH}px, calc(100vw - ${PANEL_INSET * 2}px))`,
        display: "flex",
        flexDirection: "column",
        gap: PANEL_SECTION_GAP,
        zIndex: 10,
        minHeight: 0,
        minWidth: 0,
        boxSizing: "border-box"
    }
} satisfies Record<string, CSSProperties>;
