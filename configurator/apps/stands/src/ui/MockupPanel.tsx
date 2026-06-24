import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import {
    canDownloadMockup,
    downloadMockupPdf,
    getInsufficientDpiTooltip,
    getMockupEntriesForSelection,
    hasEmptyMockupArtwork,
    hasInsufficientMockupDpi,
    isMockupEntryDpiSuitable,
    resolveMockupEntries
} from "../utils/mockupPdf";
import { formatBannerFabricLabel, isBannerFabricSide } from "../utils/fabrics";
import type { FabricSide } from "../models/ModuleModel";

function getFabricSideLabel(side: FabricSide) {
    return isBannerFabricSide(side) ? formatBannerFabricLabel(side) : side.charAt(0).toUpperCase() + side.slice(1);
}

const EMPTY_ARTWORK_TOOLTIP = "This face cannot be empty";

function MockupWarningIcon({ title }: { title: string }) {
    return (
        <span
            title={title}
            aria-label={title}
            style={styles.warningIcon}
        >
            <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                aria-hidden="true"
                focusable="false"
            >
                <circle cx="8" cy="8" r="8" fill="#c93c3c" />
                <path
                    d="M8 4.25a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V5a.75.75 0 0 1 .75-.75zm0 6.75a.875.875 0 1 0 0-1.75.875.875 0 0 0 0 1.75z"
                    fill="#ffffff"
                />
            </svg>
        </span>
    );
}

export function MockupPanel() {
    const selectedId = useEditorStore(state => state.selectedId);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const selectedModule = useEditorStore(state =>
        selectedId ? state.modulesById[selectedId] : undefined
    );
    const [isExporting, setIsExporting] = useState(false);

    const entryDrafts = useMemo(
        () => getMockupEntriesForSelection(selectedId, moduleIds, modulesById),
        [moduleIds, modulesById, selectedId]
    );
    const resolvedEntries = useMemo(
        () => resolveMockupEntries(entryDrafts),
        [entryDrafts]
    );
    const hasEmptyArtwork = hasEmptyMockupArtwork(resolvedEntries);
    const hasInsufficientDpi = hasInsufficientMockupDpi(resolvedEntries);
    const canDownload = canDownloadMockup(resolvedEntries, isExporting);

    const handleDownload = async () => {
        if (!selectedModule || !canDownload) {
            return;
        }

        setIsExporting(true);

        try {
            await downloadMockupPdf(selectedModule.id, entryDrafts);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <section style={styles.panel}>
            <div style={styles.header}>
                <div style={styles.titleRow}>
                    <h3 style={styles.heading}>Mock-up</h3>
                    {selectedModule && hasEmptyArtwork && (
                        <MockupWarningIcon title={EMPTY_ARTWORK_TOOLTIP} />
                    )}
                    {selectedModule && hasInsufficientDpi && (
                        <MockupWarningIcon
                            title="One or more image files are not suitable for printing on their fabric dimensions."
                        />
                    )}
                </div>
                <button
                    type="button"
                    style={{
                        ...styles.downloadButton,
                        ...(canDownload ? undefined : styles.disabledButton)
                    }}
                    disabled={!canDownload}
                    onClick={handleDownload}
                >
                    {isExporting ? "Exporting..." : "Download PDF"}
                </button>
            </div>

            {!selectedModule ? (
                <p style={styles.empty}>Select a module to view fabric mock-ups.</p>
            ) : (
                <div style={styles.list}>
                    {resolvedEntries.map(entry => {
                        const isEmpty = !entry.imageUrl;
                        const hasDpiIssue = !isEmpty && !isMockupEntryDpiSuitable(entry);

                        return (
                            <article key={entry.side} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={styles.fileName}>
                                        {entry.fileName ?? "No artwork"}
                                    </span>
                                    <div style={styles.badges}>
                                        {entry.isBlockout && (
                                            <span style={styles.blockoutBadge}>
                                                Block-out
                                            </span>
                                        )}
                                        <span style={styles.sideBadge}>
                                            {getFabricSideLabel(entry.side)}
                                        </span>
                                    </div>
                                </div>
                                <div style={styles.dimensions}>
                                    Print: {entry.printWidthCm} × {entry.printHeightCm} cm
                                </div>
                                <div style={styles.dimensions}>
                                    Image:{" "}
                                    {entry.pixelWidth !== null && entry.pixelHeight !== null
                                        ? `${entry.pixelWidth} × ${entry.pixelHeight} px`
                                        : "—"}
                                </div>
                                {entry.imageUrl ? (
                                    <div style={styles.previewWrap}>
                                        {hasDpiIssue && (
                                            <MockupWarningIcon
                                                title={getInsufficientDpiTooltip(
                                                    entry.printWidthCm,
                                                    entry.printHeightCm
                                                )}
                                            />
                                        )}
                                        <img
                                            src={entry.imageUrl}
                                            alt={`${entry.side} fabric mock-up`}
                                            style={styles.preview}
                                        />
                                    </div>
                                ) : (
                                    <div style={styles.placeholder}>
                                        <MockupWarningIcon title={EMPTY_ARTWORK_TOOLTIP} />
                                        <span>
                                            No artwork on {getFabricSideLabel(entry.side)} fabric
                                        </span>
                                    </div>
                                )}
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

const styles = {
    panel: {
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 15,
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflow: "hidden",
        boxSizing: "border-box"
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8,
        flexShrink: 0,
        minWidth: 0
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
        gap: 6,
        minWidth: 0
    },
    heading: {
        margin: 0,
        fontSize: 16,
        fontWeight: 700
    },
    warningIcon: {
        display: "inline-flex",
        flexShrink: 0,
        cursor: "help",
        lineHeight: 0
    },
    downloadButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        whiteSpace: "nowrap"
    },
    disabledButton: {
        opacity: 0.45,
        cursor: "not-allowed"
    },
    empty: {
        margin: 0,
        color: "#aab3bd",
        fontSize: 12,
        flexShrink: 0
    },
    list: {
        display: "grid",
        gap: 10,
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
        scrollbarGutter: "stable",
        paddingRight: 2
    },
    card: {
        display: "grid",
        gap: 4,
        padding: 10,
        border: "1px solid #3b414a",
        borderRadius: 6,
        background: "#171b21",
        minWidth: 0
    },
    cardHeader: {
        display: "flex",
        alignItems: "start",
        justifyContent: "space-between",
        gap: 8
    },
    fileName: {
        fontSize: 12,
        fontWeight: 700,
        overflowWrap: "anywhere"
    },
    badges: {
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "end",
        gap: 4
    },
    sideBadge: {
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 700,
        color: "#cbd3dc",
        background: "#315273",
        border: "1px solid #5b89b6",
        borderRadius: 999,
        padding: "2px 8px",
        textTransform: "capitalize"
    },
    blockoutBadge: {
        flexShrink: 0,
        fontSize: 11,
        fontWeight: 700,
        color: "#f7f7f2",
        background: "#4a4a4a",
        border: "1px solid #707987",
        borderRadius: 999,
        padding: "2px 8px"
    },
    dimensions: {
        fontSize: 11,
        color: "#cbd3dc"
    },
    previewWrap: {
        display: "grid",
        gap: 6,
        justifyItems: "start"
    },
    preview: {
        display: "block",
        width: "100%",
        maxWidth: "100%",
        height: "auto",
        maxHeight: "min(140px, 28vh)",
        objectFit: "contain",
        background: "#11151a",
        borderRadius: 4,
        border: "1px solid #3b414a"
    },
    placeholder: {
        display: "grid",
        placeItems: "center",
        gap: 6,
        minHeight: 72,
        padding: 10,
        borderRadius: 4,
        border: "1px dashed #4b5562",
        background: "#11151a",
        color: "#707987",
        fontSize: 11,
        textAlign: "center"
    }
} satisfies Record<string, CSSProperties>;
