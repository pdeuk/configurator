import type { CSSProperties } from "react";
import { ReviewDesignerPanel } from "./ReviewDesignerPanel";

interface ReviewSidePanelProps {
    open: boolean;
    onClose: () => void;
}

/** Full-height comments drawer that slides in from the right. */
export function ReviewSidePanel({ open, onClose }: ReviewSidePanelProps) {
    return (
        <div
            style={{
                ...styles.container,
                transform: open ? "translateX(0)" : "translateX(110%)",
                boxShadow: open ? "-18px 0 40px rgba(0, 0, 0, 0.4)" : "none"
            }}
            aria-hidden={!open}
        >
            {open && <ReviewDesignerPanel onClose={onClose} />}
        </div>
    );
}

const styles = {
    container: {
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: "min(380px, 100vw)",
        background: "#20242b",
        borderLeft: "1px solid #3b414a",
        zIndex: 30,
        transition: "transform 0.25s ease",
        boxSizing: "border-box"
    }
} satisfies Record<string, CSSProperties>;
