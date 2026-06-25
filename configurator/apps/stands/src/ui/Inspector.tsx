import type { CSSProperties, ChangeEvent } from "react";
import type { Position3, StandModule } from "../models/ModuleModel";
import { isHangingBannerType, isPromoStandType } from "../models/ModuleModel";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import { useEditorStore } from "../store/editorStore";
import {
    formatFabricSidesLabel
} from "../utils/applyFabricArtwork";
import {
    formatBannerFabricLabel,
    getActiveFabricArtwork,
    getActiveFabricPrintDimensions,
    getFabricSidesForModule,
    getModuleFabric,
    isBannerFabricSide,
    isCubeMelamineTopActive,
    MELAMINE_TOP_EXCESS_CM,
    MELAMINE_TOP_THICKNESS_CM,
    melamineBlocksFabricOptions,
    setModuleFabric
} from "../utils/fabrics";
import {
    DEFAULT_BANNER_SEGMENT_COUNT,
    MAX_BANNER_SEGMENT_COUNT,
    MIN_BANNER_SEGMENT_COUNT
} from "../utils/bannerGeometry";
import { clampBannerSegmentCount } from "../utils/bannerFabrics";
import { ProjectOverviewPanel } from "./shell/ProjectOverviewPanel";

function formatDpi(value: number) {
    return Number.isFinite(value) ? value.toFixed(1) : "0.0";
}

function formatEffectiveDpi(value: number) {
    return Number.isFinite(value) ? Math.floor(value).toString() : "0";
}

const ROTATION_STEP_DEG = 10;
const ROTATION_STEP_RAD = (ROTATION_STEP_DEG * Math.PI) / 180;
const MIN_DIMENSION = 0.05;

function metersToCm(value: number): number {
    return Math.round(value * 100);
}

function cmToMeters(value: number): number {
    return value / 100;
}

function cmStep(meters: number): number {
    return Math.round(meters * 100);
}

interface NumberFieldProps {
    label: string;
    value: number;
    step?: number;
    min?: number;
    max?: number;
    onChange: (value: number) => void;
}

function NumberField({
    label,
    value,
    step = 0.1,
    min,
    max,
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
                max={max}
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
    const activeFabricSides = useEditorStore(state => state.activeFabricSides);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const selectedModule = useEditorStore(state =>
        selectedId ? state.modulesById[selectedId] : undefined
    );
    const floorSize = useEditorStore(state => state.floorSize);
    const moduleCount = useEditorStore(state => state.moduleIds.length);
    const updateModule = useEditorStore(state => state.updateModule);
    const duplicateModule = useEditorStore(state => state.duplicateModule);
    const removeModule = useEditorStore(state => state.removeModule);
    const toggleFabricSideSelection = useEditorStore(state => state.toggleFabricSideSelection);
    const setModuleFabricBlockoutForSides = useEditorStore(
        state => state.setModuleFabricBlockoutForSides
    );
    const setModuleFabricLuminousForSides = useEditorStore(
        state => state.setModuleFabricLuminousForSides
    );
    const openArtworkEdit = useEditorStore(state => state.openArtworkEdit);

    if (!selectedModule) {
        return (
            <aside style={styles.panel}>
                <ProjectOverviewPanel
                    moduleCount={moduleCount}
                    floorWidthCm={Math.round(floorSize.width * 100)}
                    floorDepthCm={Math.round(floorSize.depth * 100)}
                />
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
    const isHangingBanner = isHangingBannerType(selectedModule.type);
    const isCube = selectedModule.type === "cube";
    const isPromoStand = isPromoStandType(selectedModule.type);
    const fabricSides = getFabricSidesForModule(selectedModule);
    const selectedFabrics = activeFabricSides.map(side => getModuleFabric(selectedModule, side));
    const allSelectedBlockout = selectedFabrics.every(fabric => fabric.isBlockout);
    const anySelectedBlockout = selectedFabrics.some(fabric => fabric.isBlockout);
    const allSelectedLuminous = selectedFabrics.every(
        fabric => fabric.isLuminous && !fabric.isBlockout
    );
    const fabricOptionsBlockedByMelamine = melamineBlocksFabricOptions(
        selectedModule,
        activeFabricSides
    );
    const topMelamineOnlySelection = isCubeMelamineTopActive(selectedModule)
        && activeFabricSides.length === 1
        && activeFabricSides[0] === "top";
    const primaryFabricSide = activeFabricSides[0] ?? fabricSides[0] ?? "front";
    const fabricReadoutSide = activeFabricSides.find(
        side => !(isCubeMelamineTopActive(selectedModule) && side === "top")
    ) ?? primaryFabricSide;
    const printDimensions = getActiveFabricPrintDimensions(
        selectedModule,
        fabricReadoutSide,
        connectionLayout.fabric.width
    );
    const mergedArtwork = getActiveFabricArtwork(
        selectedModule,
        fabricReadoutSide,
        connectionLayout.fabric.members,
        connectionLayout.fabric.width
    );
    const selectionLabel = formatFabricSidesLabel(activeFabricSides);
    const singleFabricSide = activeFabricSides.length === 1 ? activeFabricSides[0] : null;
    const singleFaceArtwork = singleFabricSide
        ? getModuleFabric(selectedModule, singleFabricSide).artwork
        : null;
    const canEditFaceArtwork = Boolean(
        singleFabricSide &&
        singleFaceArtwork &&
        !getModuleFabric(selectedModule, singleFabricSide).isBlockout &&
        !(isCubeMelamineTopActive(selectedModule) && singleFabricSide === "top")
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
                    {isHangingBanner && (
                        <NumberField
                            label="Y"
                            value={selectedModule.position.y}
                            min={0}
                            onChange={y => updatePosition({ y: Math.max(0, y) })}
                        />
                    )}
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Dimensions</h3>
                <div style={styles.grid}>
                    {isHangingBanner ? (
                        <>
                            <NumberField
                                label="Ring ø"
                                value={selectedModule.width}
                                min={MIN_DIMENSION}
                                onChange={width => updateDimensions({
                                    width: Math.max(width, MIN_DIMENSION)
                                })}
                            />
                            <NumberField
                                label="H"
                                value={selectedModule.height}
                                min={MIN_DIMENSION}
                                onChange={height => updateDimensions({
                                    height: Math.max(height, MIN_DIMENSION)
                                })}
                            />
                            <NumberField
                                label="Ring depth"
                                value={selectedModule.depth}
                                min={MIN_DIMENSION}
                                onChange={depth => updateDimensions({
                                    depth: Math.max(depth, MIN_DIMENSION)
                                })}
                            />
                            <NumberField
                                label="Faces"
                                value={selectedModule.segmentCount ?? DEFAULT_BANNER_SEGMENT_COUNT}
                                step={1}
                                min={MIN_BANNER_SEGMENT_COUNT}
                                max={MAX_BANNER_SEGMENT_COUNT}
                                onChange={segmentCount => updateDimensions({
                                    segmentCount: clampBannerSegmentCount(segmentCount)
                                })}
                            />
                        </>
                    ) : (
                        <>
                            <NumberField
                                label="Width (cm)"
                                value={metersToCm(selectedModule.width)}
                                step={1}
                                min={cmStep(MIN_DIMENSION)}
                                onChange={width => updateDimensions({
                                    width: Math.max(cmToMeters(width), MIN_DIMENSION)
                                })}
                            />
                            <NumberField
                                label="Height (cm)"
                                value={metersToCm(selectedModule.height)}
                                step={1}
                                min={cmStep(MIN_DIMENSION)}
                                onChange={height => updateDimensions({
                                    height: Math.max(cmToMeters(height), MIN_DIMENSION)
                                })}
                            />
                            <NumberField
                                label="D"
                                value={selectedModule.depth}
                                min={MIN_DIMENSION}
                                onChange={depth => updateDimensions({
                                    depth: Math.max(depth, MIN_DIMENSION)
                                })}
                            />
                        </>
                    )}
                </div>
            </section>

            <section style={styles.section}>
                <h3 style={styles.sectionTitle}>Fabric</h3>
                <p style={styles.fabricHint}>Ctrl+click to select multiple faces.</p>
                <div style={{
                    ...styles.segmented,
                    ...(fabricSides.length > 2 ? styles.cubeSegmented : undefined),
                    ...(fabricSides.length > 6 ? styles.bannerSegmented : undefined)
                }}>
                    {fabricSides.map(side => (
                        <button
                            key={side}
                            type="button"
                            style={{
                                ...styles.segmentButton,
                                ...(activeFabricSides.includes(side)
                                    ? styles.activeSegmentButton
                                    : undefined)
                            }}
                            onClick={event => toggleFabricSideSelection(
                                side,
                                event.ctrlKey || event.metaKey
                            )}
                        >
                            {isBannerFabricSide(side)
                                ? formatBannerFabricLabel(side)
                                : side}
                        </button>
                    ))}
                </div>
                {isCube && (
                    <label style={styles.melamineRow}>
                        <input
                            type="checkbox"
                            checked={selectedModule.hasMelamineTop === true}
                            onChange={event => {
                                const hasMelamineTop = event.target.checked;

                                updateModule(selectedModule.id, {
                                    hasMelamineTop,
                                    ...(hasMelamineTop ? {
                                        fabrics: setModuleFabric(selectedModule, "top", {
                                            ...getModuleFabric(selectedModule, "top"),
                                            isBlockout: false,
                                            isLuminous: false,
                                            artwork: null
                                        })
                                    } : {})
                                });
                            }}
                        />
                        Melamine top ({MELAMINE_TOP_THICKNESS_CM} cm)
                    </label>
                )}
                {isPromoStand && (
                    <div style={styles.melamineRow}>
                        Melamine top ({MELAMINE_TOP_THICKNESS_CM} cm,{" "}
                        {MELAMINE_TOP_EXCESS_CM} cm overhang)
                    </div>
                )}
                <div style={styles.readout}>
                    <div style={styles.selectionSummary}>
                        Selected: {selectionLabel}
                    </div>
                    {topMelamineOnlySelection ? (
                        <>
                            <div>
                                Solid melamine panel covering the full top face.
                            </div>
                            <div>Thickness: {MELAMINE_TOP_THICKNESS_CM} cm</div>
                        </>
                    ) : (
                        <>
                            <label style={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={allSelectedBlockout}
                                    disabled={fabricOptionsBlockedByMelamine}
                                    ref={element => {
                                        if (element) {
                                            element.indeterminate =
                                                anySelectedBlockout && !allSelectedBlockout;
                                        }
                                    }}
                                    onChange={event => setModuleFabricBlockoutForSides(
                                        selectedModule.id,
                                        activeFabricSides,
                                        event.target.checked
                                    )}
                                />
                                Block-out fabric
                            </label>
                            <label style={styles.checkboxRow}>
                                <input
                                    type="checkbox"
                                    checked={allSelectedLuminous}
                                    disabled={anySelectedBlockout || fabricOptionsBlockedByMelamine}
                                    ref={element => {
                                        if (element) {
                                            element.indeterminate =
                                                !anySelectedBlockout &&
                                                selectedFabrics.some(fabric => fabric.isLuminous) &&
                                                !allSelectedLuminous;
                                        }
                                    }}
                                    onChange={event => setModuleFabricLuminousForSides(
                                        selectedModule.id,
                                        activeFabricSides,
                                        event.target.checked
                                    )}
                                />
                                Luminous fabric
                            </label>
                            {fabricOptionsBlockedByMelamine && (
                                <div style={styles.melamineHint}>
                                    Block-out and luminous are unavailable while top uses melamine.
                                </div>
                            )}
                            <div>
                                Print size: {Math.round(printDimensions.width * 100)}cm x{" "}
                                {Math.round(printDimensions.height * 100)}cm
                            </div>
                            {mergedArtwork ? (
                                <>
                                    <button
                                        type="button"
                                        style={{
                                            ...styles.button,
                                            ...(canEditFaceArtwork ? undefined : styles.disabledButton)
                                        }}
                                        disabled={!canEditFaceArtwork}
                                        onClick={() => {
                                            if (!singleFabricSide || !canEditFaceArtwork) {
                                                return;
                                            }

                                            openArtworkEdit(selectedModule.id, singleFabricSide);
                                        }}
                                    >
                                        Edit image
                                    </button>
                                    <div>File: {mergedArtwork.fileName}</div>
                                    <div>
                                        File pixels: {mergedArtwork.pixelWidth} x{" "}
                                        {mergedArtwork.pixelHeight}
                                    </div>
                                    <div style={styles.dpiGroup}>
                                        <strong>Whole file on fabric</strong>
                                        <div>
                                            Print area: {Math.round(mergedArtwork.printWidthCm)}cm x{" "}
                                            {Math.round(mergedArtwork.printHeightCm)}cm
                                        </div>
                                        <div>
                                            DPI: {formatDpi(mergedArtwork.dpiX)} x{" "}
                                            {formatDpi(mergedArtwork.dpiY)}
                                        </div>
                                        <div>
                                            Effective DPI: {formatEffectiveDpi(mergedArtwork.effectiveDpi)}
                                        </div>
                                    </div>
                                    {mergedArtwork.rasters.some(
                                        raster =>
                                            raster.fabricWidthRatio < 0.999 ||
                                            raster.fabricHeightRatio < 0.999
                                    ) || mergedArtwork.rasters.length > 1 ? (
                                        <div style={styles.dpiGroup}>
                                            <strong>Embedded rasters</strong>
                                            {mergedArtwork.rasters.map(raster => (
                                                <div key={raster.label} style={styles.rasterBlock}>
                                                    <div>{raster.label}</div>
                                                    <div>
                                                        Pixels: {raster.pixelWidth} x {raster.pixelHeight}
                                                    </div>
                                                    <div>
                                                        Print area: {Math.round(raster.printWidthCm)}cm x{" "}
                                                        {Math.round(raster.printHeightCm)}cm
                                                    </div>
                                                    <div>
                                                        DPI: {formatDpi(raster.dpiX)} x{" "}
                                                        {formatDpi(raster.dpiY)}
                                                    </div>
                                                    <div>
                                                        Effective DPI:{" "}
                                                        {formatEffectiveDpi(raster.effectiveDpi)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : null}
                                </>
                            ) : (
                                <div>Drop artwork to apply to {selectionLabel}.</div>
                            )}
                        </>
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
                            rotation: selectedModule.rotation + ROTATION_STEP_RAD
                        })}
                    >
                        Rotate 10 +
                    </button>
                    <button
                        type="button"
                        style={styles.button}
                        onClick={() => updateModule(selectedModule.id, {
                            rotation: selectedModule.rotation - ROTATION_STEP_RAD
                        })}
                    >
                        Rotate 10 -
                    </button>
                    <button
                        type="button"
                        style={{
                            ...styles.button,
                            ...styles.fullWidthButton
                        }}
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
                        onClick={() => {
                            if (window.confirm("Remove this module from the stand?")) {
                                removeModule(selectedModule.id);
                            }
                        }}
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
        flex: "1 1 0",
        minHeight: 0,
        width: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
        scrollbarGutter: "stable",
        boxSizing: "border-box",
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 16,
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
    summary: {
        display: "grid",
        gap: 6,
        marginTop: 12,
        padding: 10,
        borderRadius: 6,
        border: "1px solid #3b414a",
        background: "#171b21",
        color: "#d7dde5",
        fontSize: 12
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
    cubeSegmented: {
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))"
    },
    bannerSegmented: {
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))"
    },
    fabricHint: {
        margin: "0 0 8px",
        color: "#707987",
        fontSize: 11
    },
    selectionSummary: {
        color: "#cbd3dc",
        fontWeight: 700
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
    melamineRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 8,
        fontSize: 12,
        color: "#cbd3dc"
    },
    melamineHint: {
        color: "#707987",
        fontSize: 11
    },
    dpiGroup: {
        display: "grid",
        gap: 4,
        paddingTop: 4,
        borderTop: "1px solid #3b414a"
    },
    rasterBlock: {
        display: "grid",
        gap: 2,
        padding: 8,
        borderRadius: 4,
        background: "#11151a"
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
    disabledButton: {
        opacity: 0.45,
        cursor: "not-allowed"
    },
    fullWidthButton: {
        gridColumn: "1 / -1"
    },
    dangerButton: {
        gridColumn: "1 / -1",
        borderColor: "#8c3d3d",
        background: "#4c2020"
    }
} satisfies Record<string, CSSProperties>;
