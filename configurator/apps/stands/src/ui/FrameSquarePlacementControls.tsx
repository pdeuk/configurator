import { useEffect } from "react";
import type { CSSProperties } from "react";
import { useEditorStore } from "../store/editorStore";
import { isFrameSquareRotationValid } from "../utils/wallLayout";

export function FrameSquarePlacementControls() {
    const placement = useEditorStore(state => state.frameSquarePlacement);
    const rotateFrameSquarePlacement = useEditorStore(
        state => state.rotateFrameSquarePlacement
    );
    const applyFrameSquarePlacement = useEditorStore(
        state => state.applyFrameSquarePlacement
    );
    const cancelFrameSquarePlacement = useEditorStore(
        state => state.cancelFrameSquarePlacement
    );
    const canApply = placement
        ? isFrameSquareRotationValid(placement.rotationSteps)
        : false;

    useEffect(() => {
        if (!placement) {
            return;
        }

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                cancelFrameSquarePlacement();
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [cancelFrameSquarePlacement, placement]);

    if (!placement) {
        return null;
    }

    return (
        <div style={styles.bar}>
            <span style={styles.label}>
                Rotate to choose door direction
            </span>
            <button
                type="button"
                style={styles.button}
                onClick={() => rotateFrameSquarePlacement()}
            >
                Rotate 90°
            </button>
            <button
                type="button"
                style={{
                    ...styles.applyButton,
                    ...(canApply
                        ? {}
                        : styles.applyButtonDisabled)
                }}
                disabled={!canApply}
                onClick={() => applyFrameSquarePlacement()}
            >
                Apply
            </button>
            <button
                type="button"
                style={styles.cancelButton}
                onClick={() => cancelFrameSquarePlacement()}
            >
                Cancel
            </button>
        </div>
    );
}

const styles: Record<string, CSSProperties> = {
    bar: {
        position: "absolute",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        background: "rgba(24, 26, 32, 0.94)",
        border: "1px solid #a855f7",
        borderRadius: 12,
        boxShadow: "0 8px 28px rgba(0, 0, 0, 0.45)",
        zIndex: 20,
        pointerEvents: "auto"
    },
    label: {
        color: "#e7e3f5",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
        marginRight: 4,
        whiteSpace: "nowrap"
    },
    button: {
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #4b5563",
        background: "#2d3340",
        color: "#f3f4f6",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
        cursor: "pointer"
    },
    applyButton: {
        padding: "8px 16px",
        borderRadius: 8,
        border: "none",
        background: "#a855f7",
        color: "#fff",
        fontSize: 13,
        fontWeight: 600,
        fontFamily: "system-ui, sans-serif",
        cursor: "pointer"
    },
    applyButtonDisabled: {
        background: "#4b3a63",
        color: "#9ca3af",
        cursor: "not-allowed"
    },
    cancelButton: {
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid transparent",
        background: "transparent",
        color: "#9ca3af",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
        cursor: "pointer"
    }
};
