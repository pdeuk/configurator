import type { CSSProperties, ReactNode } from "react";
import { useComponentRowAlign } from "./ComponentRowAlign";
import {
    PANEL_INSET,
    PANEL_SECTION_GAP,
    RIGHT_PANEL_WIDTH
} from "./layout";

interface RightPanelColumnProps {
    children: ReactNode;
}

export function RightPanelColumn({ children }: RightPanelColumnProps) {
    const { top } = useComponentRowAlign();

    return (
        <div
            style={{
                ...styles.column,
                top
            }}
        >
            {children}
        </div>
    );
}

const styles = {
    column: {
        position: "absolute",
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
