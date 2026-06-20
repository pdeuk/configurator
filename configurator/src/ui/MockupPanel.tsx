import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import { useEditorStore } from "../store/editorStore";
import {
    downloadMockupPdf,
    getMockupEntriesForSelection,
    resolveMockupEntries
} from "../utils/mockupPdf";
import { formatBannerFabricLabel, isBannerFabricSide } from "../utils/fabrics";
import type { FabricSide } from "../models/ModuleModel";

function getFabricSideLabel(side: FabricSide) {
    return isBannerFabricSide(side) ? formatBannerFabricLabel(side) : side.charAt(0).toUpperCase() + side.slice(1);
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
    const entriesWithImages = resolvedEntries.filter(entry => entry.imageUrl);
    const canDownload = entriesWithImages.length > 0 && !isExporting;

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
                <h3 style={styles.heading}>Mock-up</h3>
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
                    {resolvedEntries.map(entry => (
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
                                <img
                                    src={entry.imageUrl}
                                    alt={`${entry.side} fabric mock-up`}
                                    style={styles.preview}
                                />
                            ) : (
                                <div style={styles.placeholder}>
                                    No artwork on {entry.side} fabric
                                </div>
                            )}
                        </article>
                    ))}
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
        maxHeight: "calc(100vh - 280px)",
        display: "grid",
        gridTemplateRows: "auto 1fr",
        gap: 10,
        overflow: "hidden"
    },
    header: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 8
    },
    heading: {
        margin: 0,
        fontSize: 16,
        fontWeight: 700
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
        fontSize: 12
    },
    list: {
        display: "grid",
        gap: 10,
        overflowY: "auto",
        paddingRight: 2
    },
    card: {
        display: "grid",
        gap: 4,
        padding: 10,
        border: "1px solid #3b414a",
        borderRadius: 6,
        background: "#171b21"
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
    preview: {
        width: "100%",
        height: "auto",
        maxHeight: 140,
        objectFit: "contain",
        background: "#11151a",
        borderRadius: 4,
        border: "1px solid #3b414a"
    },
    placeholder: {
        display: "grid",
        placeItems: "center",
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
