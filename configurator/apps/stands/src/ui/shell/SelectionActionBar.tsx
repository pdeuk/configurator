import { useEditorStore } from "../../store/editorStore";
import { PermissionGuard } from "../auth";
import { useIsMobile } from "./useIsMobile";

export function SelectionActionBar() {
    const selectedId = useEditorStore(state => state.selectedId);
    const undo = useEditorStore(state => state.undo);
    const canUndo = useEditorStore(state => state.history.length > 0);
    const duplicateModule = useEditorStore(state => state.duplicateModule);
    const removeModule = useEditorStore(state => state.removeModule);
    const isMobile = useIsMobile();

    if (!selectedId) {
        return null;
    }

    return (
        <div
            style={{ ...styles.bar, ...(isMobile ? styles.barMobile : undefined) }}
            role="toolbar"
            aria-label="Selection actions"
        >
            <PermissionGuard action="projects.edit">
                <button
                    type="button"
                    style={{
                        ...styles.button,
                        opacity: canUndo ? 1 : 0.45,
                        cursor: canUndo ? "pointer" : "not-allowed"
                    }}
                    disabled={!canUndo}
                    title="Undo last change"
                    onClick={undo}
                >
                    Undo
                </button>
            </PermissionGuard>
            <PermissionGuard action="projects.edit">
                <button
                    type="button"
                    style={styles.button}
                    title="Duplicate selected module"
                    onClick={() => duplicateModule(selectedId)}
                >
                    Duplicate
                </button>
            </PermissionGuard>
            <PermissionGuard action="projects.edit">
                <button
                    type="button"
                    style={{ ...styles.button, ...styles.dangerButton }}
                    title="Delete selected module"
                    onClick={() => {
                        if (window.confirm("Remove this module from the stand?")) {
                            removeModule(selectedId);
                        }
                    }}
                >
                    Delete
                </button>
            </PermissionGuard>
        </div>
    );
}

const styles = {
    bar: {
        position: "absolute",
        left: "50%",
        bottom: 24,
        transform: "translateX(-50%)",
        zIndex: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        borderRadius: 999,
        border: "1px solid #3b414a",
        background: "rgba(32, 36, 43, 0.94)",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)"
    },
    barMobile: {
        bottom: "calc(96px + env(safe-area-inset-bottom, 0px))"
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 999,
        padding: "8px 14px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    dangerButton: {
        borderColor: "#8c3d3d",
        background: "#4c2020"
    }
} satisfies Record<string, import("react").CSSProperties>;
