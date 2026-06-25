import { useState, type CSSProperties, type ReactNode } from "react";
import { useEditorStore } from "../../store/editorStore";
import { Inspector } from "../Inspector";
import { MockupPanel } from "../MockupPanel";
import { Toolbar } from "../Toolbar";
import { PermissionGuard, usePermissions } from "../auth";
import { useARPreview } from "../ar";
import { usePresentationMode } from "../presentation/PresentationModeContext";
import { ReviewDesignerPanel } from "../reviews";
import { useProjectSession } from "../projects";
import { useProjectQuickActions } from "../projects/useProjectQuickActions";
import { useAppShell } from ".";
import { WorkspaceAccountPanel } from "./WorkspaceAccountPanel";
import { useMobileDrawer } from "./MobileChrome";

interface MobileWorkspaceProps {
    onExit: () => void;
}

interface SectionProps {
    id: string;
    title: string;
    hint?: string;
    isOpen: boolean;
    onToggle: (id: string) => void;
    children: ReactNode;
}

function Section({ id, title, hint, isOpen, onToggle, children }: SectionProps) {
    return (
        <section style={styles.section}>
            <button
                type="button"
                style={styles.sectionHeader}
                onClick={() => onToggle(id)}
                aria-expanded={isOpen}
            >
                <span style={styles.sectionTitle}>{title}</span>
                <span style={styles.sectionMeta}>
                    {hint && <span style={styles.sectionHint}>{hint}</span>}
                    <span style={styles.chevron} aria-hidden="true">
                        {isOpen ? "▾" : "▸"}
                    </span>
                </span>
            </button>
            {isOpen && <div style={styles.sectionBody}>{children}</div>}
        </section>
    );
}

interface ActionButtonProps {
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "primary" | "danger";
}

function ActionButton({ label, onClick, disabled, variant = "default" }: ActionButtonProps) {
    const variantStyle =
        variant === "primary"
            ? styles.actionPrimary
            : variant === "danger"
                ? styles.actionDanger
                : undefined;

    return (
        <button
            type="button"
            style={{ ...styles.action, ...variantStyle }}
            onClick={onClick}
            disabled={disabled}
        >
            {label}
        </button>
    );
}

export function MobileWorkspace({ onExit }: MobileWorkspaceProps) {
    const { close } = useMobileDrawer();
    const { can, canManageUsers } = usePermissions();
    const selectedId = useEditorStore(state => state.selectedId);
    const {
        activeProjectName,
        activeProjectId,
        isBusy,
        openManager,
        openTemplateGallery,
        saveActiveProject,
        saveRevision,
        createNewProject,
        deleteProject,
        renameProject
    } = useProjectSession();
    const {
        statusMessage,
        handleShare,
        handleExportQuotePdf,
        handleExportManufacturingPdf,
        handleExportManufacturingJson
    } = useProjectQuickActions();
    const { openAdmin, openAssignCustomer, openUsers, showReviews } = useAppShell();
    const { openARPreview } = useARPreview();
    const { enterPresentationMode } = usePresentationMode();

    const [openSections, setOpenSections] = useState<Set<string>>(
        () => new Set([selectedId ? "properties" : "build"])
    );
    const [message, setMessage] = useState<string | null>(null);

    const toggleSection = (id: string) => {
        setOpenSections(current => {
            const next = new Set(current);

            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const isOpen = (id: string) => openSections.has(id);

    /** Run an action that opens a full-screen surface, then collapse the drawer. */
    const runAndClose = (action: () => void) => () => {
        action();
        close();
    };

    const notify = (text: string) => {
        setMessage(text);
        window.setTimeout(() => setMessage(null), 2800);
    };

    const handleRename = async () => {
        const nextName = window.prompt("Rename project", activeProjectName)?.trim();

        if (!nextName || nextName === activeProjectName) {
            return;
        }

        await renameProject(activeProjectId, nextName);
        notify("Project renamed");
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `Delete "${activeProjectName}"? This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        await deleteProject(activeProjectId);
    };

    return (
        <div style={styles.root}>
            {(message ?? statusMessage) && (
                <p style={styles.toast}>{message ?? statusMessage}</p>
            )}

            {can("projects.view") && (
                <Section
                    id="project"
                    title="Project"
                    hint={activeProjectName}
                    isOpen={isOpen("project")}
                    onToggle={toggleSection}
                >
                    <div style={styles.actionList}>
                        <PermissionGuard action="projects.create">
                            <ActionButton
                                label="New project"
                                disabled={isBusy}
                                onClick={() => void createNewProject().then(() => notify("New project created"))}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.create">
                            <ActionButton
                                label="New from template"
                                disabled={isBusy}
                                onClick={runAndClose(openTemplateGallery)}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.view">
                            <ActionButton
                                label="Open project…"
                                disabled={isBusy}
                                onClick={runAndClose(openManager)}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.edit">
                            <ActionButton
                                label="Save"
                                variant="primary"
                                disabled={isBusy}
                                onClick={() => void saveActiveProject().then(() => notify("Project saved"))}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.edit">
                            <ActionButton
                                label="Save revision"
                                disabled={isBusy}
                                onClick={() =>
                                    void saveRevision().then(revision => {
                                        if (revision) {
                                            notify(`Saved v${revision.versionNumber}`);
                                        }
                                    })
                                }
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.edit">
                            <ActionButton
                                label="Rename"
                                disabled={isBusy}
                                onClick={() => void handleRename()}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.delete">
                            <ActionButton
                                label="Delete"
                                variant="danger"
                                disabled={isBusy}
                                onClick={() => void handleDelete()}
                            />
                        </PermissionGuard>
                    </div>
                </Section>
            )}

            {can("projects.edit") && (
                <Section
                    id="build"
                    title="Build & layout"
                    isOpen={isOpen("build")}
                    onToggle={toggleSection}
                >
                    <Toolbar />
                </Section>
            )}

            {can("projects.view") && (
                <Section
                    id="properties"
                    title="Selected item"
                    hint={selectedId ? "1 selected" : "none"}
                    isOpen={isOpen("properties")}
                    onToggle={toggleSection}
                >
                    <Inspector />
                </Section>
            )}

            {can("projects.view") && (
                <Section
                    id="share"
                    title="Share & export"
                    isOpen={isOpen("share")}
                    onToggle={toggleSection}
                >
                    <div style={styles.actionList}>
                        <PermissionGuard action="projects.edit">
                            <ActionButton
                                label="Copy share link"
                                disabled={isBusy}
                                onClick={() => void handleShare()}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.view">
                            <ActionButton
                                label="Presentation preview"
                                disabled={isBusy}
                                onClick={runAndClose(enterPresentationMode)}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="projects.view">
                            <ActionButton
                                label="AR preview"
                                disabled={isBusy}
                                onClick={runAndClose(openARPreview)}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="quotes.export">
                            <ActionButton
                                label="Quote PDF"
                                disabled={isBusy}
                                onClick={() => void handleExportQuotePdf()}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="manufacturing.export">
                            <ActionButton
                                label="Manufacturing PDF"
                                disabled={isBusy}
                                onClick={() => void handleExportManufacturingPdf()}
                            />
                        </PermissionGuard>
                        <PermissionGuard action="manufacturing.export">
                            <ActionButton
                                label="Manufacturing JSON"
                                disabled={isBusy}
                                onClick={() => void handleExportManufacturingJson()}
                            />
                        </PermissionGuard>
                    </div>
                </Section>
            )}

            {can("projects.view") && (
                <Section
                    id="mockups"
                    title="Mockups & print"
                    isOpen={isOpen("mockups")}
                    onToggle={toggleSection}
                >
                    <MockupPanel />
                </Section>
            )}

            {can("projects.edit") && (
                <Section
                    id="reviews"
                    title="Reviews"
                    isOpen={isOpen("reviews")}
                    onToggle={toggleSection}
                >
                    <ReviewDesignerPanel />
                </Section>
            )}

            {(can("settings.edit") || canManageUsers) && (
                <Section
                    id="admin"
                    title="Admin & more"
                    isOpen={isOpen("admin")}
                    onToggle={toggleSection}
                >
                    <div style={styles.actionList}>
                        <PermissionGuard action="settings.edit">
                            <ActionButton label="Customers" onClick={runAndClose(() => openAdmin("customers"))} />
                        </PermissionGuard>
                        <PermissionGuard action="settings.edit">
                            <ActionButton label="Assign customer" onClick={runAndClose(openAssignCustomer)} />
                        </PermissionGuard>
                        {canManageUsers && (
                            <ActionButton label="Users & roles" onClick={runAndClose(openUsers)} />
                        )}
                        <PermissionGuard action="settings.edit">
                            <ActionButton label="ERP" onClick={runAndClose(() => openAdmin("erp"))} />
                        </PermissionGuard>
                        <PermissionGuard action="settings.edit">
                            <ActionButton label="Analytics" onClick={runAndClose(() => openAdmin("dashboard"))} />
                        </PermissionGuard>
                        <PermissionGuard action="settings.edit">
                            <ActionButton label="Company settings" onClick={runAndClose(() => openAdmin("company"))} />
                        </PermissionGuard>
                        <PermissionGuard action="settings.edit">
                            <ActionButton label="Activity logs" onClick={runAndClose(() => openAdmin("activity"))} />
                        </PermissionGuard>
                        <PermissionGuard action="projects.edit">
                            <ActionButton
                                label="Show reviews panel"
                                onClick={() => {
                                    showReviews();
                                    setOpenSections(current => new Set(current).add("reviews"));
                                }}
                            />
                        </PermissionGuard>
                        <ActionButton
                            label="Customer portal"
                            onClick={runAndClose(() =>
                                window.open("/portal", "_blank", "noopener,noreferrer")
                            )}
                        />
                    </div>
                </Section>
            )}

            <Section
                id="account"
                title="Account"
                isOpen={isOpen("account")}
                onToggle={toggleSection}
            >
                <WorkspaceAccountPanel onExit={onExit} />
            </Section>
        </div>
    );
}

const styles = {
    root: {
        display: "flex",
        flexDirection: "column",
        gap: 10,
        fontFamily: "system-ui, sans-serif"
    },
    toast: {
        margin: 0,
        padding: "10px 12px",
        borderRadius: 8,
        background: "#283042",
        border: "1px solid #3f4a5e",
        color: "#dbe4f0",
        fontSize: 13
    },
    section: {
        border: "1px solid #2f343e",
        borderRadius: 10,
        background: "#23272f",
        overflow: "hidden"
    },
    sectionHeader: {
        width: "100%",
        minHeight: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        padding: "0 14px",
        border: "none",
        background: "transparent",
        color: "#f7f7f2",
        cursor: "pointer",
        font: "inherit",
        textAlign: "left"
    },
    sectionTitle: {
        fontSize: 15,
        fontWeight: 600
    },
    sectionMeta: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0
    },
    sectionHint: {
        maxWidth: 150,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        fontSize: 12,
        color: "#9aa3b2"
    },
    chevron: {
        fontSize: 12,
        color: "#c5cad3"
    },
    sectionBody: {
        padding: 12,
        borderTop: "1px solid #2f343e",
        display: "flex",
        flexDirection: "column",
        gap: 10
    },
    actionList: {
        display: "flex",
        flexDirection: "column",
        gap: 8
    },
    action: {
        width: "100%",
        minHeight: 48,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        border: "1px solid #3b414a",
        borderRadius: 8,
        background: "#2d3440",
        color: "#f7f7f2",
        cursor: "pointer",
        font: "inherit",
        fontSize: 14
    },
    actionPrimary: {
        border: "1px solid #8ea0b8",
        background: "#3a4558"
    },
    actionDanger: {
        border: "1px solid #7a4048",
        background: "#4a2b31",
        color: "#ffd9de"
    }
} satisfies Record<string, CSSProperties>;
