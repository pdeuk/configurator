import type { ChangeEvent, CSSProperties } from "react";
import { useEditorStore } from "../../store/editorStore";
import {
    TOOLBAR_CONTROL_HEIGHT,
    TOOLBAR_CONTROL_PADDING_X,
    TOOLBAR_FIELD_INNER_GAP,
    TOOLBAR_FIELD_LABEL_LINE_HEIGHT,
    TOOLBAR_FIELD_LABEL_SIZE,
    TOOLBAR_PANEL_SECTION_GAP
} from "./layout";
import { usePermissions } from "../auth";
import {
    FLOOR_MATERIALS,
    MAX_FLOOR_DIMENSION,
    MIN_FLOOR_SIZE,
    type FloorMaterialId
} from "../../utils/floorMaterials";

const MAX_FLOOR_SIZE_CM = MAX_FLOOR_DIMENSION * 100;
const MIN_FLOOR_SIZE_CM = MIN_FLOOR_SIZE * 100;

interface FloorControlsProps {
    variant?: "light" | "dark";
}

export function FloorControls({ variant = "light" }: FloorControlsProps) {
    const isDark = variant === "dark";
    const { can } = usePermissions();
    const floorMaterialId = useEditorStore(state => state.floorMaterialId);
    const floorSize = useEditorStore(state => state.floorSize);
    const setFloorMaterialId = useEditorStore(state => state.setFloorMaterialId);
    const setFloorSize = useEditorStore(state => state.setFloorSize);
    const showGrid = useEditorStore(state => state.showGrid);
    const setShowGrid = useEditorStore(state => state.setShowGrid);

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
        <div style={styles.controls}>
            <button
                type="button"
                style={{
                    ...styles.button,
                    ...(isDark ? styles.buttonDark : styles.buttonLight),
                    ...(showGrid
                        ? isDark
                            ? styles.buttonActiveDark
                            : styles.buttonActiveLight
                        : undefined)
                }}
                onClick={() => setShowGrid(!showGrid)}
                disabled={!can("projects.edit")}
                aria-pressed={showGrid}
            >
                {showGrid ? "Hide grid" : "Show grid"}
            </button>

            <label style={styles.field}>
                <span
                    style={{
                        ...styles.fieldLabel,
                        ...(isDark ? styles.fieldLabelDark : styles.fieldLabelLight)
                    }}
                >
                    Floor material
                </span>
                <select
                    style={{
                        ...styles.select,
                        ...(isDark ? styles.selectDark : styles.selectLight)
                    }}
                    value={floorMaterialId}
                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
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
                    <span
                        style={{
                            ...styles.sublabel,
                            ...(isDark ? styles.sublabelDark : styles.sublabelLight)
                        }}
                    >
                        Width (cm)
                    </span>
                    <input
                        type="number"
                        style={{
                            ...styles.input,
                            ...(isDark ? styles.inputDark : styles.inputLight)
                        }}
                        min={MIN_FLOOR_SIZE_CM}
                        max={MAX_FLOOR_SIZE_CM}
                        step={10}
                        value={Math.round(floorSize.width * 100)}
                        onChange={event => updateFloorWidthCm(Number(event.target.value))}
                        disabled={!can("projects.edit")}
                    />
                </label>
                <label style={styles.field}>
                    <span
                        style={{
                            ...styles.sublabel,
                            ...(isDark ? styles.sublabelDark : styles.sublabelLight)
                        }}
                    >
                        Depth (cm)
                    </span>
                    <input
                        type="number"
                        style={{
                            ...styles.input,
                            ...(isDark ? styles.inputDark : styles.inputLight)
                        }}
                        min={MIN_FLOOR_SIZE_CM}
                        max={MAX_FLOOR_SIZE_CM}
                        step={10}
                        value={Math.round(floorSize.depth * 100)}
                        onChange={event => updateFloorDepthCm(Number(event.target.value))}
                        disabled={!can("projects.edit")}
                    />
                </label>
            </div>
            <p
                style={{
                    ...styles.hint,
                    ...(isDark ? styles.hintDark : styles.hintLight)
                }}
            >
                Max {MAX_FLOOR_SIZE_CM} cm per side
            </p>
        </div>
    );
}

const styles = {
    controls: {
        display: "grid",
        gap: TOOLBAR_PANEL_SECTION_GAP,
        fontFamily: "system-ui, sans-serif"
    },
    button: {
        borderRadius: 8,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        textAlign: "left" as const
    },
    buttonLight: {
        border: "1px solid #e7e5e4",
        background: "#fafaf9",
        color: "#1c1917"
    },
    buttonDark: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2"
    },
    buttonActiveLight: {
        borderColor: "#0ea5e9",
        background: "#f0f9ff",
        color: "#0369a1"
    },
    buttonActiveDark: {
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
    fieldLabelLight: {
        color: "#44403c"
    },
    fieldLabelDark: {
        color: "#f7f7f2"
    },
    sublabel: {
        fontSize: 12
    },
    sublabelLight: {
        color: "#78716c"
    },
    sublabelDark: {
        color: "#c5cad3"
    },
    select: {
        borderRadius: 8,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        height: TOOLBAR_CONTROL_HEIGHT,
        font: "inherit",
        fontSize: 13,
        lineHeight: `${TOOLBAR_CONTROL_HEIGHT - 2}px`,
        cursor: "pointer",
        width: "100%",
        boxSizing: "border-box" as const
    },
    selectLight: {
        border: "1px solid #e7e5e4",
        background: "#ffffff",
        color: "#1c1917"
    },
    selectDark: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2"
    },
    input: {
        borderRadius: 8,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        height: TOOLBAR_CONTROL_HEIGHT,
        font: "inherit",
        fontSize: 13,
        lineHeight: `${TOOLBAR_CONTROL_HEIGHT - 2}px`,
        width: "100%",
        boxSizing: "border-box" as const
    },
    inputLight: {
        border: "1px solid #e7e5e4",
        background: "#ffffff",
        color: "#1c1917"
    },
    inputDark: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2"
    },
    dimensionGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
    },
    hint: {
        margin: 0,
        fontSize: 11
    },
    hintLight: {
        color: "#a8a29e"
    },
    hintDark: {
        color: "#9aa3b2"
    }
} satisfies Record<string, CSSProperties>;
