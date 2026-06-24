import { useCallback, useEffect, useState } from "react";
import {
    formatRevisionDate,
    revisionService,
    type ProjectRevision
} from "../../services/versions";
import { useProjectSession } from "./projectSession";

export function VersionHistoryPanel() {
    const {
        activeProjectId,
        isBusy,
        isManagerOpen,
        saveRevision,
        restoreProjectRevision
    } = useProjectSession();
    const [revisions, setRevisions] = useState<ProjectRevision[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadRevisions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const nextRevisions = await revisionService.getRevisions(activeProjectId);
            setRevisions(nextRevisions);
        } catch (loadError) {
            console.warn("Revision history load failed.", loadError);
            setError("Unable to load version history.");
        } finally {
            setIsLoading(false);
        }
    }, [activeProjectId]);

    useEffect(() => {
        if (!isManagerOpen) {
            return;
        }

        void loadRevisions();
    }, [isManagerOpen, loadRevisions]);

    useEffect(() => {
        const handleRevisionSaved = () => {
            void loadRevisions();
        };

        window.addEventListener("configurator:revision-saved", handleRevisionSaved);

        return () => {
            window.removeEventListener("configurator:revision-saved", handleRevisionSaved);
        };
    }, [loadRevisions]);

    const handleRestore = async (revision: ProjectRevision) => {
        const confirmed = window.confirm(
            `Restore v${revision.versionNumber}${
                revision.message ? ` (“${revision.message}”)` : ""
            }?\n\nYour current unsaved changes will be replaced after you confirm.`
        );

        if (!confirmed) {
            return;
        }

        try {
            await restoreProjectRevision(revision.id);
            await loadRevisions();
        } catch (restoreError) {
            console.warn("Revision restore failed.", restoreError);
            setError("Unable to restore this revision.");
        }
    };

    return (
        <section style={styles.section}>
            <div style={styles.header}>
                <div>
                    <h3 style={styles.title}>Version history</h3>
                    <p style={styles.subtitle}>
                        Saved snapshots for audit, approvals, and manufacturing.
                    </p>
                </div>
                <button
                    type="button"
                    style={styles.button}
                    disabled={isBusy}
                    onClick={() => void saveRevision()}
                >
                    Save Revision
                </button>
            </div>

            {isLoading ? (
                <p style={styles.empty}>Loading versions…</p>
            ) : revisions.length === 0 ? (
                <p style={styles.empty}>
                    No revisions yet. Use Save Revision to capture milestones like
                    “Initial quote” or “Approved”.
                </p>
            ) : (
                <div style={styles.list}>
                    {revisions.map(revision => (
                        <div key={revision.id} style={styles.item}>
                            <div style={styles.itemMain}>
                                <div style={styles.versionLine}>
                                    <span style={styles.versionNumber}>
                                        v{revision.versionNumber}
                                    </span>
                                    {revision.message && (
                                        <span style={styles.message}>{revision.message}</span>
                                    )}
                                </div>
                                <div style={styles.meta}>
                                    {formatRevisionDate(revision.createdAt)}
                                    {revision.createdBy && (
                                        <span> · {revision.createdBy}</span>
                                    )}
                                </div>
                            </div>
                            <button
                                type="button"
                                style={styles.restoreButton}
                                disabled={isBusy}
                                onClick={() => void handleRestore(revision)}
                            >
                                Restore
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && <p style={styles.error}>{error}</p>}
        </section>
    );
}

const styles = {
    section: {
        borderTop: "1px solid #3b414a",
        paddingTop: 16,
        display: "grid",
        gap: 12
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "start"
    },
    title: {
        margin: 0,
        fontSize: 16
    },
    subtitle: {
        margin: "6px 0 0",
        color: "#9aa3b2",
        fontSize: 12
    },
    list: {
        display: "grid",
        gap: 8
    },
    item: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#252932"
    },
    itemMain: {
        display: "grid",
        gap: 4,
        minWidth: 0
    },
    versionLine: {
        display: "flex",
        flexWrap: "wrap",
        gap: 8,
        alignItems: "baseline"
    },
    versionNumber: {
        fontSize: 14,
        fontWeight: 700,
        color: "#f7f7f2"
    },
    message: {
        fontSize: 13,
        color: "#dbe4f0"
    },
    meta: {
        fontSize: 12,
        color: "#9aa3b2"
    },
    restoreButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        flexShrink: 0
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        flexShrink: 0
    },
    empty: {
        margin: 0,
        color: "#9aa3b2",
        fontSize: 13
    },
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 12
    }
} satisfies Record<string, import("react").CSSProperties>;
