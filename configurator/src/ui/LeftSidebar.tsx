import type { CSSProperties } from "react";
import { MockupPanel } from "./MockupPanel";
import { Toolbar } from "./Toolbar";

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
        top: 20,
        left: 20,
        width: 280,
        display: "grid",
        gap: 12,
        zIndex: 10
    }
} satisfies Record<string, CSSProperties>;
