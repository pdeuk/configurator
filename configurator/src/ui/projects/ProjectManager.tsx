import { useEffect, useRef, useState } from "react";
import type { ProjectDocument } from "../../models/ProjectModel";
import { formatProjectSummary, useProjectSession } from "./projectSession";
import { PermissionGuard } from "../auth";
import { VersionHistoryPanel } from "./VersionHistoryPanel";

function formatUpdatedAt(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString();
}

export function ProjectManager() {
    const {
        projects,
        activeProjectId,
        isManagerOpen,
        isBusy,
        closeManager,
        refreshProjects,
        saveActiveProject,
        createNewProject,
        openProject,
        deleteProject,
        renameProject,
        openTemplateGallery
    } = useProjectSession();
    const [renameTarget, setRenameTarget] = useState<ProjectDocument | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [newProjectMenuOpen, setNewProjectMenuOpen] = useState(false);
    const newProjectMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isManagerOpen) {
            return;
        }

        void refreshProjects();
    }, [isManagerOpen, refreshProjects]);

    useEffect(() => {
        if (!newProjectMenuOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (newProjectMenuRef.current?.contains(event.target as Node)) {
                return;
            }

            setNewProjectMenuOpen(false);
        };

        window.addEventListener("mousedown", handlePointerDown);

        return () => {
            window.removeEventListener("mousedown", handlePointerDown);
        };
    }, [newProjectMenuOpen]);

    if (!isManagerOpen) {
        return null;
    }

    const handleDelete = async (project: ProjectDocument) => {
        const confirmed = window.confirm(
            `Delete "${project.name}"? This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        await deleteProject(project.id);
    };

    const handleRenameSubmit = async () => {
        if (!renameTarget) {
            return;
        }

        await renameProject(renameTarget.id, renameValue);
        setRenameTarget(null);
        setRenameValue("");
    };

    return (
        <div style={styles.backdrop} onClick={closeManager}>
            <div
                style={styles.modal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="project-manager-title"
            >
                <div style={styles.header}>
                    <div>
                        <h2 id="project-manager-title" style={styles.title}>
                            Project Manager
                        </h2>
                        <p style={styles.subtitle}>
                            Manage saved stand layouts stored on this device.
                        </p>
                    </div>
                    <button
                        type="button"
                        style={styles.iconButton}
                        onClick={closeManager}
                        aria-label="Close project manager"
                    >
                        ×
                    </button>
                </div>

                <div style={styles.actionsRow}>
                    <PermissionGuard action="projects.create">
                        <div style={styles.menuAnchor} ref={newProjectMenuRef}>
                            <button
                                type="button"
                                style={styles.buttonPrimary}
                                disabled={isBusy}
                                onClick={() => setNewProjectMenuOpen(current => !current)}
                                aria-haspopup="menu"
                                aria-expanded={newProjectMenuOpen}
                            >
                                New Project ▾
                            </button>
                            {newProjectMenuOpen && (
                                <div style={styles.dropdownMenu} role="menu">
                                    <button
                                        type="button"
                                        style={styles.menuItem}
                                        disabled={isBusy}
                                        onClick={() => {
                                            setNewProjectMenuOpen(false);
                                            void createNewProject();
                                        }}
                                    >
                                        Blank Project
                                    </button>
                                    <button
                                        type="button"
                                        style={styles.menuItem}
                                        disabled={isBusy}
                                        onClick={() => {
                                            setNewProjectMenuOpen(false);
                                            openTemplateGallery();
                                        }}
                                    >
                                        From Template
                                    </button>
                                </div>
                            )}
                        </div>
                    </PermissionGuard>
                    <PermissionGuard action="projects.edit">
                        <button
                            type="button"
                            style={styles.button}
                            disabled={isBusy}
                            onClick={() => void saveActiveProject()}
                        >
                            Save Project
                        </button>
                    </PermissionGuard>
                </div>

                <div style={styles.list}>
                    {projects.length === 0 && (
                        <p style={styles.emptyState}>No saved projects yet.</p>
                    )}

                    {projects.map(project => {
                        const summary = formatProjectSummary(project);
                        const isActive = project.id === activeProjectId;

                        return (
                            <div
                                key={project.id}
                                style={{
                                    ...styles.card,
                                    ...(isActive ? styles.cardActive : undefined)
                                }}
                            >
                                <div style={styles.cardHeader}>
                                    <div>
                                        <div style={styles.projectName}>{summary.name}</div>
                                        {isActive && (
                                            <span style={styles.activeBadge}>Current</span>
                                        )}
                                    </div>
                                    <div style={styles.cardActions}>
                                        <PermissionGuard action="projects.view">
                                            <button
                                                type="button"
                                                style={styles.smallButton}
                                                disabled={isBusy || isActive}
                                                onClick={() => void openProject(project.id)}
                                            >
                                                Open
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard action="projects.edit">
                                            <button
                                                type="button"
                                                style={styles.smallButton}
                                                disabled={isBusy}
                                                onClick={() => {
                                                    setRenameTarget(project);
                                                    setRenameValue(project.name);
                                                }}
                                            >
                                                Rename
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard action="projects.delete">
                                            <button
                                                type="button"
                                                style={styles.dangerButton}
                                                disabled={isBusy}
                                                onClick={() => void handleDelete(project)}
                                            >
                                                Delete
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </div>

                                <div style={styles.metaGrid}>
                                    <span>Updated {formatUpdatedAt(summary.updatedAt)}</span>
                                    <span>{summary.moduleCount} modules</span>
                                    <span>
                                        Floor {summary.floorWidthCm} × {summary.floorDepthCm} cm
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <PermissionGuard action="projects.edit">
                    <VersionHistoryPanel />
                </PermissionGuard>

                {renameTarget && (
                    <div style={styles.renameOverlay}>
                        <div style={styles.renameDialog}>
                            <h3 style={styles.renameTitle}>Rename project</h3>
                            <input
                                type="text"
                                style={styles.input}
                                value={renameValue}
                                onChange={event => setRenameValue(event.target.value)}
                                autoFocus
                            />
                            <div style={styles.renameActions}>
                                <button
                                    type="button"
                                    style={styles.button}
                                    disabled={isBusy}
                                    onClick={() => {
                                        setRenameTarget(null);
                                        setRenameValue("");
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    style={styles.buttonPrimary}
                                    disabled={isBusy || !renameValue.trim()}
                                    onClick={() => void handleRenameSubmit()}
                                >
                                    Save Name
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const styles = {
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(10, 12, 16, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
        padding: 20,
        boxSizing: "border-box"
    },
    modal: {
        width: "min(720px, 100%)",
        maxHeight: "min(80vh, 820px)",
        overflow: "auto",
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 10,
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
        padding: 20,
        display: "grid",
        gap: 16,
        fontFamily: "system-ui, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "start"
    },
    title: {
        margin: 0,
        fontSize: 20
    },
    subtitle: {
        margin: "6px 0 0",
        color: "#c5cad3",
        fontSize: 13
    },
    iconButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        width: 32,
        height: 32,
        cursor: "pointer",
        fontSize: 20,
        lineHeight: 1
    },
    actionsRow: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
    },
    menuAnchor: {
        position: "relative"
    },
    dropdownMenu: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        minWidth: 180,
        background: "#252932",
        border: "1px solid #3b414a",
        borderRadius: 8,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
        padding: 6,
        display: "grid",
        gap: 4,
        zIndex: 10
    },
    menuItem: {
        border: "none",
        background: "transparent",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        textAlign: "left"
    },
    list: {
        display: "grid",
        gap: 10
    },
    emptyState: {
        margin: 0,
        color: "#9aa3b2",
        fontSize: 13
    },
    card: {
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 12,
        background: "#252932",
        display: "grid",
        gap: 10
    },
    cardActive: {
        borderColor: "#8ea0b8",
        boxShadow: "inset 0 0 0 1px rgba(142, 160, 184, 0.35)"
    },
    cardHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "start"
    },
    projectName: {
        fontSize: 15,
        fontWeight: 600
    },
    activeBadge: {
        display: "inline-block",
        marginTop: 6,
        padding: "2px 8px",
        borderRadius: 999,
        background: "#3a4558",
        color: "#dbe4f0",
        fontSize: 11
    },
    cardActions: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap",
        justifyContent: "flex-end"
    },
    metaGrid: {
        display: "grid",
        gap: 4,
        color: "#c5cad3",
        fontSize: 12
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    buttonPrimary: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    smallButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    dangerButton: {
        border: "1px solid #7a4048",
        background: "#4a2b31",
        color: "#ffd9de",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    renameOverlay: {
        position: "fixed",
        inset: 0,
        background: "rgba(10, 12, 16, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50
    },
    renameDialog: {
        width: "min(420px, calc(100vw - 40px))",
        background: "#20242b",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 16,
        display: "grid",
        gap: 12
    },
    renameTitle: {
        margin: 0,
        fontSize: 16
    },
    input: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13,
        width: "100%",
        boxSizing: "border-box"
    },
    renameActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8
    }
} satisfies Record<string, import("react").CSSProperties>;
