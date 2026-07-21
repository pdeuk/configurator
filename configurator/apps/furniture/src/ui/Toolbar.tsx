import type { ChangeEvent } from "react";
import { useState } from "react";
import { useEditorStore } from "../store/editorStore";
import {
    TOOLBAR_CONTROL_HEIGHT,
    TOOLBAR_CONTROL_PADDING_X,
    TOOLBAR_FIELD_INNER_GAP,
    TOOLBAR_FIELD_LABEL_LINE_HEIGHT,
    TOOLBAR_FIELD_LABEL_SIZE,
    TOOLBAR_PANEL_PADDING,
    TOOLBAR_PANEL_SECTION_GAP,
    TOOLBAR_PANEL_TITLE_LINE_HEIGHT,
    TOOLBAR_PANEL_TITLE_SIZE
} from "./shell/layout";
import { usePermissions } from "./auth";
import { useComponentRowAlign } from "./shell/ComponentRowAlign";
import {
    COMPONENT_OPTIONS,
    createComponentModule,
    type ComponentType
} from "../utils/componentCatalog";
import {
    FLOOR_MATERIALS,
    GRID_SIZE,
    MIN_FLOOR_SIZE,
    type FloorMaterialId
} from "../utils/floorMaterials";

const MAX_FLOOR_SIZE_CM = GRID_SIZE * 100;
const MIN_FLOOR_SIZE_CM = MIN_FLOOR_SIZE * 100;

interface ToolbarProps {
    floorOnly?: boolean;
}

export function Toolbar({ floorOnly = false }: ToolbarProps) {
    const { can } = usePermissions();
    const { registerToolbarPanel } = useComponentRowAlign();
    const addModule = useEditorStore(state => state.addModule);
    const undo = useEditorStore(state => state.undo);
    const canUndo = useEditorStore(state => state.history.length > 0);
    const floorMaterialId = useEditorStore(state => state.floorMaterialId);
    const floorSize = useEditorStore(state => state.floorSize);
    const setFloorMaterialId = useEditorStore(state => state.setFloorMaterialId);
    const setFloorSize = useEditorStore(state => state.setFloorSize);
    const showGrid = useEditorStore(state => state.showGrid);
    const setShowGrid = useEditorStore(state => state.setShowGrid);
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

    const updateFloorWidthCm = (value: number) => {
        if (!Number.isFinite(value)) {
            return;
        }

        setFloorSize({ width: value / 100 });
    };

    const updateFloorDepthCm = (value: number) => {
        if (!Number.isFinite(value)) {
            return;
        }

        setFloorSize({ depth: value / 100 });
    };

    return (
        <div style={styles.panel} ref={registerToolbarPanel}>
            <h2 style={styles.panelTitle}>{floorOnly ? "Floor" : "Add to stand"}</h2>
            {!floorOnly && (
                <>
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
                </>
            )}

            <button
                type="button"
                style={{
                    ...styles.button,
                    ...(showGrid ? styles.buttonActive : undefined)
                }}
                onClick={() => setShowGrid(!showGrid)}
                disabled={!can("projects.edit")}
                aria-pressed={showGrid}
            >
                {showGrid ? "Hide grid" : "Show grid"}
            </button>

            <label style={styles.field}>
                <span style={styles.fieldLabel}>Floor material</span>
                <select
                    style={styles.select}
                    value={floorMaterialId}
                    onChange={event =>
                        setFloorMaterialId(event.target.value as FloorMaterialId)
                    }
                    disabled={!can("projects.edit")}
                >
                    {FLOOR_MATERIALS.map(material => (
                        <option key={material.id} value={material.id}>
                            {material.label}
                        </option>
                    ))}
                </select>
            </label>

            <div style={styles.dimensionGrid}>
                <label style={styles.field}>
                    <span style={styles.sublabel}>Width (cm)</span>
                    <input
                        type="number"
                        style={styles.input}
                        min={MIN_FLOOR_SIZE_CM}
                        max={MAX_FLOOR_SIZE_CM}
                        step={10}
                        value={Math.round(floorSize.width * 100)}
                        onChange={event => updateFloorWidthCm(Number(event.target.value))}
                        disabled={!can("projects.edit")}
                    />
                </label>
                <label style={styles.field}>
                    <span style={styles.sublabel}>Depth (cm)</span>
                    <input
                        type="number"
                        style={styles.input}
                        min={MIN_FLOOR_SIZE_CM}
                        max={MAX_FLOOR_SIZE_CM}
                        step={10}
                        value={Math.round(floorSize.depth * 100)}
                        onChange={event => updateFloorDepthCm(Number(event.target.value))}
                        disabled={!can("projects.edit")}
                    />
                </label>
            </div>
            <p style={styles.hint}>Max {MAX_FLOOR_SIZE_CM} cm (grid size)</p>
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
    buttonActive: {
        borderColor: "#8ea0b8",
        background: "#3a4558"
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
    sublabel: {
        fontSize: 12,
        color: "#c5cad3"
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
    },
    input: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        height: TOOLBAR_CONTROL_HEIGHT,
        font: "inherit",
        fontSize: 13,
        lineHeight: `${TOOLBAR_CONTROL_HEIGHT - 2}px`,
        width: "100%",
        boxSizing: "border-box"
    },
    dimensionGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
    },
    hint: {
        margin: 0,
        fontSize: 11,
        color: "#9aa3b2"
    }
} satisfies Record<string, import("react").CSSProperties>;
