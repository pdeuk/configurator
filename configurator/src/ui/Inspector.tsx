import type { CSSProperties, ChangeEvent } from "react";
import type { Position3, StandModule } from "../models/ModuleModel";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import { useEditorStore } from "../store/editorStore";
import {
    FABRIC_SIDES,
    getMergedFabricArtwork,
    getModuleFabric
} from "../utils/fabrics";

const ROTATION_STEP = Math.PI / 2;
const MIN_DIMENSION = 0.05;
const CENTIMETERS_PER_METER = 100;

interface NumberFieldProps {
    label: string;
    value: number;
    step?: number;
    min?: number;
    onChange: (value: number) => void;
}

function NumberField({
    label,
    value,
    step = 0.1,
    min,
    onChange
}: NumberFieldProps) {
    return (
        <label style={styles.field}>
            <span style={styles.label}>{label}</span>
            <input
                type="number"
                value={Number(value.toFixed(3))}
                step={step}
                min={min}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const next = Number(event.target.value);

                    if (Number.isFinite(next)) {
                        onChange(next);
                    }
                }}
                style={styles.input}
            />
        </label>
    );
}

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function Inspector() {
    const selectedId = useEditorStore(state => state.selectedId);
    const activeFabricSide = useEditorStore(state => state.activeFabricSide);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const selectedModule = useEditorStore(state =>
        selectedId ? state.modulesById[selectedId] : undefined
    );
    const updateModule = useEditorStore(state => state.updateModule);
    const duplicateModule = useEditorStore(state => state.duplicateModule);
    const removeModule = useEditorStore(state => state.removeModule);
    const setActiveFabricSide = useEditorStore(state => state.setActiveFabricSide);
    const setModuleFabricBlockout = useEditorStore(state => state.setModuleFabricBlockout);

    if (!selectedModule) {
        return (
            <aside style={styles.panel}>
                <h2 style={styles.heading}>Properties</h2>
                <p style={styles.empty}>Select a module to edit it.</p>
            </aside>
        );
    }

    const updatePosition = (position: Partial<Position3>) => {
        updateModule(selectedModule.id, {
            position: {
                ...selectedModule.position,
                ...position
            }
        });
    };

    const updateDimensions = (dimensions: Partial<StandModule>) => {
        updateModule(selectedModule.id, dimensions);
    };
    const modules = moduleIds.map(id => modulesById[id]).filter(isStandModule);
    const connectionLayout = getFrameConnectionLayout(selectedModule, modules);
    const activeFabric = getModuleFabric(selectedModule, activeFabricSide);
    const mergedArtwork = getMergedFabricArtwork(
        activeFabricSide,
        selectedModule,
        connectionLayout.fabric.members,
        connectionLayout.fabric.width
    );

    return (
        <aside style={styles.panel}>
            <div style={styles.header}>
                <div>
                    <h2 style={styles.heading}>Properties</h2>
                    <div style={styles.meta}>{selectedModule.type} - {selectedModule.id}</div>
                </div>
            </div>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Position</h3>
                <div style={styles.grid}>
                    <NumberField
                        label="X"
                        value={selectedModule.position.x}
                        onChange={x => updatePosition({ x })}
                    />
                    <NumberField
                        label="Z"
                        value={selectedModule.position.z}
                        onChange={z => updatePosition({ z })}
                    />
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Dimensions</h3>
                <div style={styles.grid}>
                    <NumberField
                        label="W"
                        value={selectedModule.width}
                        min={MIN_DIMENSION}
                        onChange={width => updateDimensions({ width: Math.max(width, MIN_DIMENSION) })}
                    />
                    <NumberField
                        label="H"
                        value={selectedModule.height}
                        min={MIN_DIMENSION}
                        onChange={height => updateDimensions({ height: Math.max(height, MIN_DIMENSION) })}
                    />
                    <NumberField
                        label="D"
                        value={selectedModule.depth}
                        min={MIN_DIMENSION}
                        onChange={depth => updateDimensions({ depth: Math.max(depth, MIN_DIMENSION) })}
                    />
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Fabric</h3>
                <div style={styles.segmented}>
                    {FABRIC_SIDES.map(side => (
                        <button
                            key={side}
                            type="button"
                            style={{
                                ...styles.segmentButton,
                                ...(activeFabricSide === side ? styles.activeSegmentButton : undefined)
                            }}
                            onClick={() => setActiveFabricSide(side)}
                        >
                            {side}
                        </button>
                    ))}
                </div>
                <div style={styles.readout}>
                    <label style={styles.checkboxRow}>
                        <input
                            type="checkbox"
                            checked={activeFabric.isBlockout}
                            onChange={event => setModuleFabricBlockout(
                                selectedModule.id,
                                activeFabricSide,
                                event.target.checked
                            )}
                        />
                        Block-out fabric
                    </label>
                    <div>
                        Size: {Math.round(connectionLayout.fabric.width * CENTIMETERS_PER_METER)}cm x{" "}
                        {Math.round(selectedModule.height * CENTIMETERS_PER_METER)}cm
                    </div>
                    {mergedArtwork ? (
                        <>
                            <div>File: {mergedArtwork.fileName}</div>
                            <div>
                                Pixels: {mergedArtwork.pixelWidth} x{" "}
                                {mergedArtwork.pixelHeight}
                            </div>
                            <div>
                                DPI: {mergedArtwork.dpiX.toFixed(1)} x{" "}
                                {mergedArtwork.dpiY.toFixed(1)}
                            </div>
                            <strong>
                                Effective DPI: {Math.floor(mergedArtwork.effectiveDpi)}
                            </strong>
                        </>
                    ) : (
                        <div>Drop artwork to calculate DPI for the {activeFabricSide} fabric.</div>
                    )}
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Actions</h3>
                <div style={styles.actions}>
                    <button
                        type="button"
                        style={styles.button}
                        onClick={() => updateModule(selectedModule.id, {
                            rotation: selectedModule.rotation + ROTATION_STEP
                        })}
                    >
                        Rotate 90
                    </button>
                    <button
                        type="button"
                        style={styles.button}
                        onClick={() => duplicateModule(selectedModule.id)}
                    >
                        Duplicate
                    </button>
                    <button
                        type="button"
                        style={{
                            ...styles.button,
                            ...styles.dangerButton
                        }}
                        onClick={() => removeModule(selectedModule.id)}
                    >
                        Delete
                    </button>
                </div>
            </section>
        </aside>
    );
}

const styles = {
    panel: {
        position: "absolute",
        top: 20,
        right: 20,
        width: 280,
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 16,
        zIndex: 10,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        fontFamily: "system-ui, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "start",
        gap: 12
    },
    heading: {
        margin: 0,
        fontSize: 16,
        fontWeight: 700
    },
    meta: {
        marginTop: 4,
        color: "#aab3bd",
        fontSize: 12,
        overflowWrap: "anywhere"
    },
    empty: {
        margin: "12px 0 0",
        color: "#aab3bd",
        fontSize: 13
    },
    section: {
        marginTop: 18
    },
    sectionTitle: {
        margin: "0 0 10px",
        fontSize: 12,
        fontWeight: 700,
        color: "#cbd3dc",
        textTransform: "uppercase",
        letterSpacing: 0
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: 10
    },
    field: {
        display: "grid",
        gap: 5,
        fontSize: 12,
        color: "#cbd3dc"
    },
    label: {
        fontWeight: 700
    },
    input: {
        width: "100%",
        boxSizing: "border-box",
        background: "#11151a",
        color: "#f7f7f2",
        border: "1px solid #4b5562",
        borderRadius: 6,
        padding: "7px 8px",
        font: "inherit"
    },
    actions: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8
    },
    readout: {
        display: "grid",
        gap: 6,
        padding: 10,
        border: "1px solid #3b414a",
        borderRadius: 6,
        background: "#171b21",
        color: "#d7dde5",
        fontSize: 12,
        overflowWrap: "anywhere"
    },
    segmented: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 6,
        marginBottom: 8
    },
    segmentButton: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#cbd3dc",
        borderRadius: 6,
        padding: "7px 8px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        textTransform: "capitalize"
    },
    activeSegmentButton: {
        background: "#315273",
        color: "#ffffff",
        borderColor: "#5b89b6"
    },
    checkboxRow: {
        display: "flex",
        alignItems: "center",
        gap: 8
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
    dangerButton: {
        gridColumn: "1 / -1",
        borderColor: "#8c3d3d",
        background: "#4c2020"
    }
} satisfies Record<string, CSSProperties>;
