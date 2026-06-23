import type { CSSProperties, DragEvent } from "react";
import { useMemo, useState } from "react";
import type { StandModule } from "../models/ModuleModel";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import { useEditorStore } from "../store/editorStore";
import {
    createArtworkAssignmentsForSides,
    formatFabricSidesLabel
} from "../utils/applyFabricArtwork";
import {
    filterMelamineBlockedFabricSides,
    getActiveFabricArtwork,
    isCubeMelamineTopActive
} from "../utils/fabrics";
import {
    CHROME_ROW_TOP,
    LEFT_CHROME_OFFSET,
    RIGHT_CHROME_OFFSET
} from "./shell/layout";

function formatArtworkMessage(
    fileName: string,
    effectiveDpi: number,
    rasterCount: number,
    fabricCount: number
) {
    const targetSummary = fabricCount > 1
        ? `${fabricCount} fabrics`
        : "fabric";
    const wholeFileSummary = `${fileName}: ${Math.floor(effectiveDpi)} DPI on ${targetSummary}`;

    if (rasterCount <= 1) {
        return wholeFileSummary;
    }

    return `${wholeFileSummary} (${rasterCount} embedded rasters analyzed)`;
}

const ACCEPTED_TYPES = ".pdf,.tif,.tiff,.jpg,.jpeg,.png";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function ArtworkDropZone() {
    const selectedId = useEditorStore(state => state.selectedId);
    const activeFabricSides = useEditorStore(state => state.activeFabricSides);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const selectedModule = useEditorStore(state =>
        selectedId ? state.modulesById[selectedId] : undefined
    );
    const setModuleArtworkForSides = useEditorStore(state => state.setModuleArtworkForSides);
    const [isDragging, setIsDragging] = useState(false);
    const [transientMessage, setTransientMessage] = useState<string | null>(null);

    const modules = useMemo(
        () => moduleIds.map(id => modulesById[id]).filter(isStandModule),
        [moduleIds, modulesById]
    );
    const primaryFabricSide = activeFabricSides[0] ?? "front";
    const mergedArtwork = useMemo(() => {
        if (!selectedModule) {
            return null;
        }

        const connectionLayout = getFrameConnectionLayout(selectedModule, modules);

        return getActiveFabricArtwork(
            selectedModule,
            primaryFabricSide,
            connectionLayout.fabric.members,
            connectionLayout.fabric.width
        );
    }, [activeFabricSides, modules, primaryFabricSide, selectedModule]);
    const artworkMessage = useMemo(() => {
        if (!mergedArtwork) {
            return null;
        }

        return formatArtworkMessage(
            mergedArtwork.fileName,
            mergedArtwork.effectiveDpi,
            mergedArtwork.rasters.length,
            activeFabricSides.length
        );
    }, [activeFabricSides.length, mergedArtwork]);
    const displayMessage = transientMessage ?? artworkMessage;
    const artworkSides = selectedModule
        ? filterMelamineBlockedFabricSides(selectedModule, activeFabricSides)
        : activeFabricSides;
    const selectionLabel = formatFabricSidesLabel(activeFabricSides);
    const artworkSelectionLabel = formatFabricSidesLabel(artworkSides);
    const topMelamineBlocksAllSides = selectedModule
        && isCubeMelamineTopActive(selectedModule)
        && artworkSides.length === 0
        && activeFabricSides.length > 0;

    const applyArtworkFile = async (file: File) => {
        if (!selectedModule || activeFabricSides.length === 0) {
            setTransientMessage("Select a module and at least one fabric face.");
            return;
        }

        if (artworkSides.length === 0) {
            setTransientMessage("Top face uses melamine and cannot accept artwork.");
            return;
        }

        try {
            setTransientMessage("Analyzing artwork...");
            const assignments = await createArtworkAssignmentsForSides(
                file,
                selectedModule,
                artworkSides,
                modules
            );
            setModuleArtworkForSides(selectedModule.id, assignments);
            setTransientMessage(null);
        } catch (error) {
            setTransientMessage(error instanceof Error ? error.message : "Unable to load artwork.");
        }
    };

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files.item(0);

        if (!selectedModule) {
            setTransientMessage("Select a module before dropping artwork.");
            return;
        }

        if (!file) {
            return;
        }

        await applyArtworkFile(file);
    };

    return (
        <div style={styles.band}>
            <div
                style={{
                    ...styles.dropZone,
                    ...(isDragging ? styles.activeDropZone : undefined)
                }}
                onDragEnter={event => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragOver={event => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = selectedModule ? "copy" : "none";
                }}
                onDragLeave={event => {
                    event.preventDefault();
                    setIsDragging(false);
                }}
                onDrop={handleDrop}
            >
                <input
                    id="artwork-file-input"
                    type="file"
                    accept={ACCEPTED_TYPES}
                    style={styles.fileInput}
                    aria-label="Upload artwork"
                    onChange={async event => {
                        const file = event.target.files?.item(0);

                        if (!file) {
                            return;
                        }

                        await applyArtworkFile(file);
                        event.target.value = "";
                    }}
                />
                <div style={styles.dropZoneRow}>
                    <strong style={styles.title}>Artwork</strong>
                    <span style={styles.text}>
                        {selectedModule
                            ? topMelamineBlocksAllSides
                                ? "Top uses melamine — select another face for artwork."
                                : artworkSides.length < activeFabricSides.length
                                    ? `Drop artwork onto ${artworkSelectionLabel} (top uses melamine).`
                                    : `Drop PDF, TIFF, JPG, or PNG onto ${selectionLabel}.`
                            : "Select a module to upload artwork."}
                    </span>
                    <button
                        type="button"
                        style={styles.browseButton}
                        onClick={() => {
                            document.getElementById("artwork-file-input")?.click();
                        }}
                    >
                        Browse files
                    </button>
                </div>
                {displayMessage && <span style={styles.message}>{displayMessage}</span>}
            </div>
        </div>
    );
}

const ARTWORK_BAND_WIDTH = `min(560px, calc(100vw - ${LEFT_CHROME_OFFSET + RIGHT_CHROME_OFFSET + 40}px))`;

const styles = {
    band: {
        position: "absolute",
        top: CHROME_ROW_TOP,
        left: LEFT_CHROME_OFFSET,
        right: RIGHT_CHROME_OFFSET,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        zIndex: 11,
        pointerEvents: "none"
    },
    dropZone: {
        position: "relative",
        width: ARTWORK_BAND_WIDTH,
        minHeight: 52,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 4,
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px dashed #707987",
        background: "rgba(32, 36, 43, 0.92)",
        color: "#f7f7f2",
        fontFamily: "system-ui, sans-serif",
        boxSizing: "border-box",
        pointerEvents: "auto"
    },
    dropZoneRow: {
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 0
    },
    activeDropZone: {
        borderColor: "#ff4db8",
        background: "rgba(47, 34, 52, 0.96)"
    },
    fileInput: {
        position: "absolute",
        inset: 0,
        opacity: 0,
        cursor: "pointer",
        pointerEvents: "none"
    },
    browseButton: {
        flexShrink: 0,
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "5px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        whiteSpace: "nowrap"
    },
    title: {
        flexShrink: 0,
        fontSize: 13
    },
    text: {
        flex: 1,
        minWidth: 0,
        color: "#cbd3dc",
        fontSize: 12,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    message: {
        color: "#ffcc7a",
        fontSize: 12,
        overflowWrap: "anywhere"
    }
} satisfies Record<string, CSSProperties>;
