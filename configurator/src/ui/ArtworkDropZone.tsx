import type { CSSProperties, DragEvent } from "react";
import { useState } from "react";
import type { StandModule } from "../models/ModuleModel";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import { useEditorStore } from "../store/editorStore";
import { createArtworkInfo } from "../utils/artwork";

const ACCEPTED_TYPES = ".pdf,.tif,.tiff,.jpg,.jpeg,.png";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function ArtworkDropZone() {
    const selectedId = useEditorStore(state => state.selectedId);
    const activeFabricSide = useEditorStore(state => state.activeFabricSide);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const selectedModule = useEditorStore(state =>
        selectedId ? state.modulesById[selectedId] : undefined
    );
    const setModuleArtwork = useEditorStore(state => state.setModuleArtwork);
    const [isDragging, setIsDragging] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragging(false);

        const file = event.dataTransfer.files.item(0);

        if (!selectedModule) {
            setMessage("Select a frame before dropping artwork.");
            return;
        }

        if (!file) {
            return;
        }

        try {
            setMessage("Analyzing artwork...");
            const modules = moduleIds.map(id => modulesById[id]).filter(isStandModule);
            const mergedWidth = getFrameConnectionLayout(selectedModule, modules).fabric.width;
            const artwork = await createArtworkInfo(
                file,
                mergedWidth,
                selectedModule.height
            );
            setModuleArtwork(selectedModule.id, activeFabricSide, artwork);
            setMessage(`${artwork.fileName}: ${Math.round(artwork.effectiveDpi)} DPI`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : "Unable to load artwork.");
        }
    };

    return (
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
                type="file"
                accept={ACCEPTED_TYPES}
                style={styles.fileInput}
                aria-label="Upload artwork"
                onChange={async event => {
                    const file = event.target.files?.item(0);

                    if (!file || !selectedModule) {
                        return;
                    }

                    try {
                        setMessage("Analyzing artwork...");
                        const modules = moduleIds.map(id => modulesById[id]).filter(isStandModule);
                        const mergedWidth = getFrameConnectionLayout(selectedModule, modules).fabric.width;
                        const artwork = await createArtworkInfo(
                            file,
                            mergedWidth,
                            selectedModule.height
                        );
                        setModuleArtwork(selectedModule.id, activeFabricSide, artwork);
                        setMessage(`${artwork.fileName}: ${Math.round(artwork.effectiveDpi)} DPI`);
                    } catch (error) {
                        setMessage(error instanceof Error ? error.message : "Unable to load artwork.");
                    } finally {
                        event.target.value = "";
                    }
                }}
            />
            <strong style={styles.title}>Artwork</strong>
            <span style={styles.text}>
                {selectedModule
                    ? `Drop PDF, TIFF, JPG, or PNG onto the ${activeFabricSide} fabric.`
                    : "Select a frame to upload artwork."}
            </span>
            {message && <span style={styles.message}>{message}</span>}
        </div>
    );
}

const styles = {
    dropZone: {
        position: "absolute",
        left: 20,
        bottom: 20,
        width: 280,
        minHeight: 88,
        display: "grid",
        alignContent: "center",
        gap: 4,
        padding: 14,
        borderRadius: 8,
        border: "1px dashed #707987",
        background: "rgba(32, 36, 43, 0.92)",
        color: "#f7f7f2",
        zIndex: 10,
        fontFamily: "system-ui, sans-serif",
        boxSizing: "border-box"
    },
    activeDropZone: {
        borderColor: "#ff4db8",
        background: "rgba(47, 34, 52, 0.96)"
    },
    fileInput: {
        position: "absolute",
        inset: 0,
        opacity: 0,
        cursor: "pointer"
    },
    title: {
        fontSize: 13
    },
    text: {
        color: "#cbd3dc",
        fontSize: 12
    },
    message: {
        color: "#ffcc7a",
        fontSize: 12,
        overflowWrap: "anywhere"
    }
} satisfies Record<string, CSSProperties>;
