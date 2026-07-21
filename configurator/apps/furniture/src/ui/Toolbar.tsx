import type { ChangeEvent } from "react";
import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import {
    TOOLBAR_FIELD_INNER_GAP,
    TOOLBAR_FIELD_LABEL_LINE_HEIGHT,
    TOOLBAR_FIELD_LABEL_SIZE,
    TOOLBAR_PANEL_PADDING,
    TOOLBAR_PANEL_SECTION_GAP,
    TOOLBAR_PANEL_TITLE_LINE_HEIGHT,
    TOOLBAR_PANEL_TITLE_SIZE,
    TOOLBAR_CONTROL_HEIGHT,
    TOOLBAR_CONTROL_PADDING_X
} from "./shell/layout";
import { usePermissions } from "./auth";
import { useComponentRowAlign } from "./shell/ComponentRowAlign";
import { FloorControls } from "./shell/FloorControls";
import {
    COMPONENT_OPTIONS,
    createComponentModule,
    type ComponentType
} from "../utils/componentCatalog";

export function Toolbar() {
    const { can } = usePermissions();
    const { registerToolbarPanel } = useComponentRowAlign();
    const addModule = useEditorStore(state => state.addModule);
    const undo = useEditorStore(state => state.undo);
    const canUndo = useEditorStore(state => state.history.length > 0);
    const [componentSelection, setComponentSelection] = useState("");

    const handleComponentChange = (event: ChangeEvent<HTMLSelectElement>) => {
        const type = event.target.value as ComponentType | "";

        if (!type) {
            return;
        }

        const moduleCount = useEditorStore.getState().moduleIds.length;

        addModule(createComponentModule(type, moduleCount));
        setComponentSelection("");
    };

    return (
        <div style={styles.panel} ref={registerToolbarPanel}>
            <h2 style={styles.panelTitle}>Add to stand</h2>
            <label style={styles.field}>
                <span style={styles.fieldLabel}>Component</span>
                <select
                    style={styles.select}
                    value={componentSelection}
                    onChange={handleComponentChange}
                    disabled={!can("projects.create")}
                    title="Choose a component to place on the floor"
                >
                    <option value="">Choose component…</option>
                    <optgroup label="Walls">
                        {COMPONENT_OPTIONS.filter(option => option.id === "wall").map(option => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Furniture">
                        {COMPONENT_OPTIONS.filter(option =>
                            option.id === "cube" || option.id === "promoStand"
                        ).map(option => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Branding">
                        {COMPONENT_OPTIONS.filter(option =>
                            option.id === "circularBanner" || option.id === "squareBanner"
                        ).map(option => (
                            <option key={option.id} value={option.id}>
                                {option.label}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </label>

            <button
                type="button"
                style={{
                    ...styles.button,
                    opacity: canUndo ? 1 : 0.45,
                    cursor: canUndo ? "pointer" : "not-allowed"
                }}
                disabled={!canUndo || !can("projects.edit")}
                onClick={undo}
                title="Undo last change"
            >
                Undo
            </button>

            <FloorControls variant="dark" />
        </div>
    );
}

const styles = {
    panel: {
        background: "#20242b",
        padding: TOOLBAR_PANEL_PADDING,
        borderRadius: 8,
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        fontFamily: "system-ui, sans-serif",
        display: "grid",
        gap: TOOLBAR_PANEL_SECTION_GAP
    },
    panelTitle: {
        margin: 0,
        fontSize: TOOLBAR_PANEL_TITLE_SIZE,
        lineHeight: `${TOOLBAR_PANEL_TITLE_LINE_HEIGHT}px`,
        fontWeight: 700
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    field: {
        display: "grid",
        gap: TOOLBAR_FIELD_INNER_GAP
    },
    fieldLabel: {
        fontSize: TOOLBAR_FIELD_LABEL_SIZE,
        lineHeight: `${TOOLBAR_FIELD_LABEL_LINE_HEIGHT}px`,
        fontWeight: 600
    },
    select: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        height: TOOLBAR_CONTROL_HEIGHT,
        font: "inherit",
        fontSize: 13,
        lineHeight: `${TOOLBAR_CONTROL_HEIGHT - 2}px`,
        cursor: "pointer",
        width: "100%",
        boxSizing: "border-box"
    }
} satisfies Record<string, import("react").CSSProperties>;
