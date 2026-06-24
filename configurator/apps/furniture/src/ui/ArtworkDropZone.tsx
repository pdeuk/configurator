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

    const hintText = selectedModule
        ? topMelamineBlocksAllSides
            ? "Top uses melamine — select another face."
            : artworkSides.length < activeFabricSides.length
                ? `Drop onto ${artworkSelectionLabel} (top uses melamine).`
                : `Drop PDF, TIFF, JPG, or PNG onto ${selectionLabel}.`
        : "Select a module to upload artwork.";

    return (
        <div
            className={isDragging ? "artwork-drop-zone artwork-drop-zone--active" : "artwork-drop-zone"}
                title={displayMessage ?? hintText}
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
                <div className="artwork-drop-zone-row">
                    <strong className="artwork-drop-zone-title">Artwork</strong>
                    <span className="artwork-drop-zone-text">
                        {displayMessage ?? hintText}
                    </span>
                    <button
                        type="button"
                        className="artwork-drop-zone-button"
                        onClick={() => {
                            document.getElementById("artwork-file-input")?.click();
                        }}
                    >
                        Browse
                    </button>
                </div>
            </div>
    );
}

const styles = {
    fileInput: {
        position: "absolute",
        inset: 0,
        opacity: 0,
        cursor: "pointer",
        pointerEvents: "none"
    }
} satisfies Record<string, CSSProperties>;
