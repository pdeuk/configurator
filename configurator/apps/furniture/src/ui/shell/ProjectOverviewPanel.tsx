import type { CSSProperties } from "react";
import { useProjectQuickActions } from "../projects/useProjectQuickActions";
import { useProjectSession } from "../projects/projectSession";
import { PermissionGuard } from "../auth";
import { usePresentationMode } from "../presentation/PresentationModeContext";

interface ProjectOverviewPanelProps {
    moduleCount: number;
    floorWidthCm: number;
    floorDepthCm: number;
}

function formatSavedAt(value: string | undefined): string {
    if (!value) {
        return "Not saved yet";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit"
    });
}

export function ProjectOverviewPanel({
    moduleCount,
    floorWidthCm,
    floorDepthCm
}: ProjectOverviewPanelProps) {
    const { projects, activeProjectId } = useProjectSession();
    const { enterPresentationMode } = usePresentationMode();
    const {
        isBusy,
        statusMessage,
        handleShare,
        handleExportQuotePdf
    } = useProjectQuickActions();

    const activeProject = projects.find(project => project.id === activeProjectId);

    return (
        <>
            <h2 style={styles.heading}>Project Overview</h2>
            <dl style={styles.stats}>
                <div style={styles.statRow}>
                    <dt style={styles.statLabel}>Modules</dt>
                    <dd style={styles.statValue}>{moduleCount}</dd>
                </div>
                <div style={styles.statRow}>
                    <dt style={styles.statLabel}>Floor</dt>
                    <dd style={styles.statValue}>{floorWidthCm} × {floorDepthCm} cm</dd>
                </div>
                <div style={styles.statRow}>
                    <dt style={styles.statLabel}>Last saved</dt>
                    <dd style={styles.statValue}>{formatSavedAt(activeProject?.updatedAt)}</dd>
                </div>
            </dl>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Quick Actions</h3>
                <div style={styles.actions}>
                    <PermissionGuard action="quotes.export">
                        <button
                            type="button"
                            style={styles.primaryButton}
                            disabled={isBusy}
                            title="Download quote PDF"
                            onClick={() => void handleExportQuotePdf()}
                        >
                            Generate Quote
                        </button>
                    </PermissionGuard>
                    <PermissionGuard action="projects.edit">
                        <button
                            type="button"
                            style={styles.button}
                            disabled={isBusy}
                            title="Create a client review link"
                            onClick={() => void handleShare()}
                        >
                            Share Project
                        </button>
                    </PermissionGuard>
                    <PermissionGuard action="projects.view">
                        <button
                            type="button"
                            style={styles.button}
                            disabled={isBusy}
                            title="Hide editor panels for customer preview"
                            onClick={enterPresentationMode}
                        >
                            Preview Presentation
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {statusMessage && <p style={styles.message}>{statusMessage}</p>}
            <p style={styles.hint}>Select a module in the scene to edit its properties.</p>
        </>
    );
}

const styles = {
    heading: {
        margin: 0,
        fontSize: 16,
        fontWeight: 700
    },
    stats: {
        margin: "14px 0 0",
        display: "grid",
        gap: 10,
        padding: 12,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#171b21"
    },
    statRow: {
        display: "grid",
        gap: 2
    },
    statLabel: {
        margin: 0,
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        color: "#9aa3b2"
    },
    statValue: {
        margin: 0,
        fontSize: 13,
        color: "#f7f7f2",
        fontWeight: 600
    },
    section: {
        marginTop: 16,
        paddingTop: 16,
        borderTop: "1px solid #3b414a"
    },
    sectionTitle: {
        margin: "0 0 10px",
        fontSize: 12,
        fontWeight: 700,
        color: "#cbd3dc",
        textTransform: "uppercase",
        letterSpacing: "0.04em"
    },
    actions: {
        display: "grid",
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
    primaryButton: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    message: {
        margin: "12px 0 0",
        fontSize: 12,
        color: "#cbd5e1",
        background: "rgba(32, 36, 43, 0.92)",
        border: "1px solid #3b414a",
        borderRadius: 999,
        padding: "6px 10px"
    },
    hint: {
        margin: "14px 0 0",
        color: "#9aa3b2",
        fontSize: 13,
        lineHeight: 1.45
    }
} satisfies Record<string, CSSProperties>;
