import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FabricSide } from "../models/ModuleModel";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import { useEditorStore } from "../store/editorStore";
import { createArtworkInfoFromCanvasAsync } from "../utils/artwork";
import {
    DEFAULT_ARTWORK_EDIT_STATE,
    getArtworkEditOutputDimensions,
    getArtworkEditPreviewDimensions,
    loadArtworkInfoImage,
    renderEditedArtworkToCanvas,
    revokeArtworkImageUrl,
    rotateArtworkEditState,
    updateArtworkEditScale,
    type ArtworkCropRect,
    type ArtworkEditState
} from "../utils/artworkEdit";
import {
    formatBannerFabricLabel,
    getActiveFabricArtwork,
    getActiveFabricPrintDimensions,
    getModuleFabric,
    isBannerFabricSide,
    restoreArtworkFromSource
} from "../utils/fabrics";
import { getFabricFaceLayout } from "../utils/fabricFaceGeometry";

function getFabricSideLabel(side: FabricSide) {
    return isBannerFabricSide(side) ? formatBannerFabricLabel(side) : side;
}

type CropHandle = "move" | "nw" | "ne" | "sw" | "se";

interface CropDragState {
    handle: CropHandle;
    startX: number;
    startY: number;
    startCrop: ArtworkCropRect;
}

export function ArtworkEditor() {
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const closeArtworkEdit = useEditorStore(state => state.closeArtworkEdit);
    const setConnectedFabricArtwork = useEditorStore(state => state.setConnectedFabricArtwork);
    const [editState, setEditState] = useState<ArtworkEditState>(DEFAULT_ARTWORK_EDIT_STATE);
    const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isResettingImage, setIsResettingImage] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const cropDragRef = useRef<CropDragState | null>(null);
    const sourceCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const modules = useMemo(
        () => moduleIds.map(id => modulesById[id]).filter((module): module is NonNullable<typeof module> => !!module),
        [moduleIds, modulesById]
    );

    const editContext = useMemo(() => {
        if (!artworkEditMode) {
            return null;
        }

        const module = modulesById[artworkEditMode.moduleId];

        if (!module) {
            return null;
        }

        const connectionLayout = getFrameConnectionLayout(module, modules);
        const layout = getFabricFaceLayout(
            module,
            artworkEditMode.side,
            connectionLayout
        );
        const artwork = getActiveFabricArtwork(
            module,
            artworkEditMode.side,
            connectionLayout.fabric.members,
            connectionLayout.fabric.width
        );
        const printDimensions = getActiveFabricPrintDimensions(
            module,
            artworkEditMode.side,
            connectionLayout.fabric.width
        );
        const fabric = getModuleFabric(module, artworkEditMode.side);

        return {
            module,
            side: artworkEditMode.side,
            layout,
            artwork,
            printDimensions,
            fabric,
            fabricMembers: connectionLayout.fabric.members
        };
    }, [artworkEditMode, modules, modulesById]);

    useEffect(() => {
        if (!editContext?.artwork) {
            setSourceImage(null);
            return;
        }

        let cancelled = false;
        setLoadError(null);
        setEditState(DEFAULT_ARTWORK_EDIT_STATE);

        loadArtworkInfoImage(editContext.artwork)
            .then(image => {
                if (!cancelled) {
                    setSourceImage(image);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setLoadError("Unable to load artwork for editing.");
                    setSourceImage(null);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [editContext?.artwork, editContext?.side, editContext?.module.id]);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!sourceImage || !editContext) {
            setPreviewUrl(null);
            return;
        }

        let cancelled = false;
        const frameId = window.requestAnimationFrame(() => {
            if (cancelled) {
                return;
            }

            try {
                const output = getArtworkEditPreviewDimensions(
                    editContext.printDimensions.width,
                    editContext.printDimensions.height
                );
                const previewCanvas = renderEditedArtworkToCanvas(
                    sourceImage,
                    editState,
                    output.width,
                    output.height
                );

                if (!cancelled) {
                    setPreviewUrl(previewCanvas.toDataURL("image/png"));
                }
            } catch {
                if (!cancelled) {
                    setPreviewUrl(null);
                }
            }
        });

        return () => {
            cancelled = true;
            window.cancelAnimationFrame(frameId);
        };
    }, [editContext, editState, sourceImage]);

    const drawSourceOverlay = useCallback(() => {
        const canvas = sourceCanvasRef.current;

        if (!canvas || !sourceImage) {
            return;
        }

        const context = canvas.getContext("2d");

        if (!context) {
            return;
        }

        const maxWidth = canvas.clientWidth;
        const maxHeight = canvas.clientHeight;
        const imageAspect = sourceImage.naturalWidth / sourceImage.naturalHeight;
        const viewAspect = maxWidth / maxHeight;
        let drawWidth: number;
        let drawHeight: number;

        if (imageAspect > viewAspect) {
            drawWidth = maxWidth;
            drawHeight = maxWidth / imageAspect;
        } else {
            drawHeight = maxHeight;
            drawWidth = maxHeight * imageAspect;
        }

        const offsetX = (maxWidth - drawWidth) / 2;
        const offsetY = (maxHeight - drawHeight) / 2;
        canvas.width = maxWidth;
        canvas.height = maxHeight;
        context.clearRect(0, 0, maxWidth, maxHeight);
        context.fillStyle = "#11151a";
        context.fillRect(0, 0, maxWidth, maxHeight);
        context.drawImage(sourceImage, offsetX, offsetY, drawWidth, drawHeight);

        const cropX = offsetX + editState.crop.x * drawWidth;
        const cropY = offsetY + editState.crop.y * drawHeight;
        const cropW = editState.crop.width * drawWidth;
        const cropH = editState.crop.height * drawHeight;

        context.fillStyle = "rgba(0, 0, 0, 0.45)";
        context.fillRect(offsetX, offsetY, drawWidth, cropY - offsetY);
        context.fillRect(offsetX, cropY + cropH, drawWidth, offsetY + drawHeight - (cropY + cropH));
        context.fillRect(offsetX, cropY, cropX - offsetX, cropH);
        context.fillRect(cropX + cropW, cropY, offsetX + drawWidth - (cropX + cropW), cropH);

        context.strokeStyle = "#1f8cff";
        context.lineWidth = 2;
        context.strokeRect(cropX, cropY, cropW, cropH);
    }, [editState.crop, sourceImage]);

    useEffect(() => {
        drawSourceOverlay();
    }, [drawSourceOverlay]);

    const getCropDragState = (
        event: ReactPointerEvent<HTMLCanvasElement>
    ): CropDragState | null => {
        const canvas = sourceCanvasRef.current;

        if (!canvas || !sourceImage) {
            return null;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const maxWidth = rect.width;
        const maxHeight = rect.height;
        const imageAspect = sourceImage.naturalWidth / sourceImage.naturalHeight;
        const viewAspect = maxWidth / maxHeight;
        let drawWidth: number;
        let drawHeight: number;

        if (imageAspect > viewAspect) {
            drawWidth = maxWidth;
            drawHeight = maxWidth / imageAspect;
        } else {
            drawHeight = maxHeight;
            drawWidth = maxHeight * imageAspect;
        }

        const offsetX = (maxWidth - drawWidth) / 2;
        const offsetY = (maxHeight - drawHeight) / 2;
        const cropX = offsetX + editState.crop.x * drawWidth;
        const cropY = offsetY + editState.crop.y * drawHeight;
        const cropW = editState.crop.width * drawWidth;
        const cropH = editState.crop.height * drawHeight;
        const handleSize = 12;

        const handles: Array<{ handle: CropHandle; x: number; y: number }> = [
            { handle: "nw", x: cropX, y: cropY },
            { handle: "ne", x: cropX + cropW, y: cropY },
            { handle: "sw", x: cropX, y: cropY + cropH },
            { handle: "se", x: cropX + cropW, y: cropY + cropH }
        ];

        for (const entry of handles) {
            if (
                Math.abs(x - entry.x) <= handleSize &&
                Math.abs(y - entry.y) <= handleSize
            ) {
                return {
                    handle: entry.handle,
                    startX: x,
                    startY: y,
                    startCrop: editState.crop
                };
            }
        }

        if (x >= cropX && x <= cropX + cropW && y >= cropY && y <= cropY + cropH) {
            return {
                handle: "move",
                startX: x,
                startY: y,
                startCrop: editState.crop
            };
        }

        return null;
    };

    const applyCropDrag = (drag: CropDragState, x: number, y: number, drawWidth: number, drawHeight: number) => {
        const dx = (x - drag.startX) / drawWidth;
        const dy = (y - drag.startY) / drawHeight;
        const start = drag.startCrop;

        if (drag.handle === "move") {
            setEditState(current => ({
                ...current,
                crop: {
                    ...start,
                    x: Math.min(Math.max(start.x + dx, 0), 1 - start.width),
                    y: Math.min(Math.max(start.y + dy, 0), 1 - start.height)
                }
            }));
            return;
        }

        let next = { ...start };

        if (drag.handle.includes("n")) {
            const nextY = Math.min(Math.max(start.y + dy, 0), start.y + start.height - 0.05);
            next.height = start.height + (start.y - nextY);
            next.y = nextY;
        }

        if (drag.handle.includes("s")) {
            next.height = Math.min(Math.max(start.height + dy, 0.05), 1 - start.y);
        }

        if (drag.handle.includes("w")) {
            const nextX = Math.min(Math.max(start.x + dx, 0), start.x + start.width - 0.05);
            next.width = start.width + (start.x - nextX);
            next.x = nextX;
        }

        if (drag.handle.includes("e")) {
            next.width = Math.min(Math.max(start.width + dx, 0.05), 1 - start.x);
        }

        setEditState(current => ({
            ...current,
            crop: next
        }));
    };

    const handleSourcePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        const drag = getCropDragState(event);

        if (!drag) {
            return;
        }

        event.currentTarget.setPointerCapture(event.pointerId);
        cropDragRef.current = drag;
    };

    const handleSourcePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        const drag = cropDragRef.current;
        const canvas = sourceCanvasRef.current;

        if (!drag || !canvas || !sourceImage) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const maxWidth = rect.width;
        const maxHeight = rect.height;
        const imageAspect = sourceImage.naturalWidth / sourceImage.naturalHeight;
        const viewAspect = maxWidth / maxHeight;
        const drawWidth = imageAspect > viewAspect
            ? maxWidth
            : maxHeight * imageAspect;
        const drawHeight = imageAspect > viewAspect
            ? maxWidth / imageAspect
            : maxHeight;

        applyCropDrag(drag, x, y, drawWidth, drawHeight);
        drawSourceOverlay();
    };

    const handleSourcePointerUp = (event: ReactPointerEvent<HTMLCanvasElement>) => {
        cropDragRef.current = null;

        if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }
    };

    const handleSave = async () => {
        if (!editContext?.artwork || !sourceImage || editContext.fabric.isBlockout) {
            return;
        }

        setIsSaving(true);

        try {
            const output = getArtworkEditOutputDimensions(
                editContext.printDimensions.width,
                editContext.printDimensions.height
            );
            const previewCanvas = renderEditedArtworkToCanvas(
                sourceImage,
                editState,
                output.width,
                output.height
            );
            const artwork = await createArtworkInfoFromCanvasAsync(
                previewCanvas,
                {
                    fileName: editContext.artwork.fileName,
                    fileType: editContext.artwork.fileType
                },
                editContext.printDimensions.width,
                editContext.printDimensions.height,
                editContext.artwork.sourceArtwork
            );

            const supersededUrls = new Set<string>();

            for (const member of editContext.fabricMembers) {
                const imageUrl = getModuleFabric(member, editContext.side).artwork?.imageUrl;

                if (imageUrl) {
                    supersededUrls.add(imageUrl);
                }
            }

            setConnectedFabricArtwork(editContext.module.id, editContext.side, artwork);

            for (const imageUrl of supersededUrls) {
                if (imageUrl !== artwork.imageUrl) {
                    revokeArtworkImageUrl(imageUrl);
                }
            }

            closeArtworkEdit();
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetImage = async () => {
        if (!editContext?.artwork || editContext.fabric.isBlockout) {
            return;
        }

        const restoredArtwork = restoreArtworkFromSource(
            editContext.artwork,
            editContext.printDimensions.width,
            editContext.printDimensions.height
        );

        if (!restoredArtwork) {
            return;
        }

        setIsResettingImage(true);

        try {
            const supersededUrls = new Set<string>();

            for (const member of editContext.fabricMembers) {
                const imageUrl = getModuleFabric(member, editContext.side).artwork?.imageUrl;

                if (imageUrl) {
                    supersededUrls.add(imageUrl);
                }
            }

            setConnectedFabricArtwork(editContext.module.id, editContext.side, restoredArtwork);

            for (const imageUrl of supersededUrls) {
                if (imageUrl !== restoredArtwork.imageUrl) {
                    revokeArtworkImageUrl(imageUrl);
                }
            }

            setEditState(DEFAULT_ARTWORK_EDIT_STATE);
        } finally {
            setIsResettingImage(false);
        }
    };

    const isBusy = isSaving || isResettingImage;
    const canResetImage = !!editContext?.artwork?.sourceArtwork;

    if (!artworkEditMode || !editContext) {
        return null;
    }

    if (!editContext.artwork || editContext.fabric.isBlockout) {
        return (
            <div style={styles.overlay}>
                <div style={styles.panel}>
                    <p style={styles.message}>This face has no editable artwork.</p>
                    <button type="button" style={styles.button} onClick={closeArtworkEdit}>
                        Close
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.overlay}>
            <div style={styles.shell}>
                <header style={styles.header}>
                    <div>
                        <h2 style={styles.title}>Edit image</h2>
                        <div style={styles.subtitle}>
                            {getFabricSideLabel(editContext.side)} ·{" "}
                            {Math.round(editContext.printDimensions.width * 100)} ×{" "}
                            {Math.round(editContext.printDimensions.height * 100)} cm
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <button
                            type="button"
                            style={styles.button}
                            onClick={closeArtworkEdit}
                            disabled={isBusy}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            style={{
                                ...styles.button,
                                ...styles.primaryButton
                            }}
                            onClick={handleSave}
                            disabled={!sourceImage || isBusy || !!loadError}
                        >
                            {isSaving ? "Saving..." : "Apply to face"}
                        </button>
                    </div>
                </header>

                <div style={styles.workspace}>
                    <aside style={styles.tools}>
                        <button
                            type="button"
                            style={styles.button}
                            onClick={() => setEditState(current => rotateArtworkEditState(current))}
                        >
                            Rotate 90°
                        </button>
                        <label style={styles.field}>
                            <span>Stretch X</span>
                            <input
                                type="range"
                                min={0.25}
                                max={2}
                                step={0.01}
                                value={editState.scaleX}
                                onChange={event => setEditState(current =>
                                    updateArtworkEditScale(
                                        current,
                                        "x",
                                        Number(event.target.value)
                                    )
                                )}
                            />
                        </label>
                        <label style={styles.field}>
                            <span>Stretch Y</span>
                            <input
                                type="range"
                                min={0.25}
                                max={2}
                                step={0.01}
                                value={editState.scaleY}
                                disabled={editState.preserveAspectRatio}
                                onChange={event => setEditState(current =>
                                    updateArtworkEditScale(
                                        current,
                                        "y",
                                        Number(event.target.value)
                                    )
                                )}
                            />
                        </label>
                        <label style={styles.checkboxRow}>
                            <input
                                type="checkbox"
                                checked={editState.preserveAspectRatio}
                                onChange={event => setEditState(current => ({
                                    ...current,
                                    preserveAspectRatio: event.target.checked,
                                    scaleY: event.target.checked ? current.scaleX : current.scaleY
                                }))}
                            />
                            Preserve aspect ratio
                        </label>
                        <button
                            type="button"
                            style={styles.button}
                            onClick={() => setEditState(DEFAULT_ARTWORK_EDIT_STATE)}
                            disabled={isBusy}
                        >
                            Reset edits
                        </button>
                        <button
                            type="button"
                            style={styles.button}
                            onClick={handleResetImage}
                            disabled={isBusy || !canResetImage}
                        >
                            {isResettingImage ? "Resetting..." : "Reset image"}
                        </button>
                        {!canResetImage && (
                            <p style={styles.hint}>
                                Re-upload the image to enable reset-to-original.
                            </p>
                        )}
                        <p style={styles.hint}>
                            Drag the crop box on the source image. The camera is aligned to this face.
                        </p>
                    </aside>

                    <div style={styles.canvasGrid}>
                        <section style={styles.canvasPanel}>
                            <h3 style={styles.panelTitle}>Source & crop</h3>
                            {loadError ? (
                                <p style={styles.message}>{loadError}</p>
                            ) : (
                                <canvas
                                    ref={sourceCanvasRef}
                                    style={styles.sourceCanvas}
                                    onPointerDown={handleSourcePointerDown}
                                    onPointerMove={handleSourcePointerMove}
                                    onPointerUp={handleSourcePointerUp}
                                    onPointerCancel={handleSourcePointerUp}
                                />
                            )}
                        </section>
                        <section style={styles.canvasPanel}>
                            <h3 style={styles.panelTitle}>Face preview</h3>
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt="Edited artwork preview"
                                    style={styles.previewImage}
                                />
                            ) : (
                                <div style={styles.previewPlaceholder}>Loading preview...</div>
                            )}
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: "absolute",
        inset: 0,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        pointerEvents: "auto",
        background: "rgba(17, 21, 26, 0.88)"
    },
    shell: {
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        gap: 12,
        flex: 1,
        minHeight: 0,
        padding: 16,
        boxSizing: "border-box"
    },
    panel: {
        margin: "auto",
        padding: 20,
        borderRadius: 8,
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "start",
        gap: 12,
        padding: "14px 16px",
        borderRadius: 8,
        background: "rgba(32, 36, 43, 0.96)",
        border: "1px solid #3b414a",
        color: "#f7f7f2"
    },
    title: {
        margin: 0,
        fontSize: 18
    },
    subtitle: {
        marginTop: 4,
        color: "#cbd3dc",
        fontSize: 12
    },
    headerActions: {
        display: "flex",
        gap: 8
    },
    workspace: {
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr)",
        gap: 12,
        minHeight: 0,
        overflow: "hidden"
    },
    tools: {
        display: "grid",
        gap: 10,
        alignContent: "start",
        padding: 14,
        borderRadius: 8,
        background: "rgba(32, 36, 43, 0.96)",
        border: "1px solid #3b414a",
        color: "#f7f7f2",
        fontFamily: "system-ui, sans-serif"
    },
    field: {
        display: "grid",
        gap: 6,
        fontSize: 12
    },
    checkboxRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12
    },
    hint: {
        margin: 0,
        color: "#aab3bd",
        fontSize: 11,
        lineHeight: 1.4
    },
    canvasGrid: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 12,
        minHeight: 0
    },
    canvasPanel: {
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 8,
        minHeight: 0,
        padding: 12,
        borderRadius: 8,
        background: "rgba(32, 36, 43, 0.96)",
        border: "1px solid #3b414a"
    },
    panelTitle: {
        margin: 0,
        fontSize: 12,
        color: "#cbd3dc",
        textTransform: "uppercase",
        letterSpacing: 0.4
    },
    sourceCanvas: {
        width: "100%",
        height: "100%",
        minHeight: 280,
        borderRadius: 6,
        border: "1px solid #3b414a",
        cursor: "crosshair",
        touchAction: "none"
    },
    previewImage: {
        width: "100%",
        height: "100%",
        minHeight: 280,
        objectFit: "contain",
        background: "#11151a",
        borderRadius: 6,
        border: "1px solid #3b414a"
    },
    previewPlaceholder: {
        display: "grid",
        placeItems: "center",
        minHeight: 280,
        color: "#aab3bd",
        background: "#11151a",
        borderRadius: 6,
        border: "1px solid #3b414a"
    },
    message: {
        margin: 0,
        color: "#ffcc7a",
        fontSize: 13
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
    primaryButton: {
        background: "#315273",
        borderColor: "#5b89b6"
    }
} satisfies Record<string, CSSProperties>;
