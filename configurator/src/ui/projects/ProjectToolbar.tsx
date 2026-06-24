import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AsyncErrorTrigger, PdfExportErrorBoundary } from "../system";
import { PermissionGuard, usePermissions } from "../auth";
import { useARPreview } from "../ar";
import { useAppShell } from "../shell";
import { EditorModeIndicator } from "../shell/EditorModeIndicator";
import { MenuDivider, MenuSection, menuStyles } from "../shell/menuStyles";
import { usePresentationMode } from "../presentation/PresentationModeContext";
import { useProjectSession } from "./projectSession";
import { useProjectQuickActions } from "./useProjectQuickActions";
import {
    MORE_MENU_RIGHT,
    MORE_MENU_TOP,
    PANEL_SECTION_GAP,
    TOOLBAR_CONTROL_PADDING_X
} from "../shell/layout";

interface ProjectToolbarProps {
    onOpenComponentLibrary?: () => void;
    onOpenMockups?: () => void;
    renderLayout?: (left: ReactNode, right: ReactNode) => ReactNode;
}

export function ProjectToolbar({
    onOpenComponentLibrary,
    onOpenMockups,
    renderLayout
}: ProjectToolbarProps) {
    const {
        activeProjectName,
        activeProjectId,
        isBusy,
        openManager,
        openTemplateGallery,
        saveActiveProject,
        saveRevision,
        refreshProjects,
        createNewProject,
        deleteProject,
        renameProject
    } = useProjectSession();
    const { canManageUsers } = usePermissions();
    const { openARPreview } = useARPreview();
    const { enterPresentationMode } = usePresentationMode();
    const {
        openAdmin,
        openAssignCustomer,
        openUsers,
        showReviews
    } = useAppShell();
    const {
        statusMessage: quickActionMessage,
        handleShare,
        handleExportQuotePdf,
        handleExportManufacturingPdf,
        handleExportManufacturingJson
    } = useProjectQuickActions();
    const [menuOpen, setMenuOpen] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const [revisionMessage, setRevisionMessage] = useState<string | null>(null);
    const [exportBoundaryError, setExportBoundaryError] = useState<Error | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const moreContainerRef = useRef<HTMLDivElement>(null);

    const closeMenus = () => {
        setMenuOpen(false);
        setMoreMenuOpen(false);
    };

    useEffect(() => {
        void refreshProjects();
    }, [refreshProjects]);

    useEffect(() => {
        if (!menuOpen && !moreMenuOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;

            if (containerRef.current?.contains(target)) {
                return;
            }

            if (moreContainerRef.current?.contains(target)) {
                return;
            }

            closeMenus();
        };

        window.addEventListener("mousedown", handlePointerDown);

        return () => {
            window.removeEventListener("mousedown", handlePointerDown);
        };
    }, [menuOpen, moreMenuOpen]);

    const handleRenameProject = async () => {
        const nextName = window.prompt("Rename project", activeProjectName)?.trim();

        if (!nextName || nextName === activeProjectName) {
            return;
        }

        await renameProject(activeProjectId, nextName);
        setRevisionMessage("Project renamed");
    };

    const handleDeleteProject = async () => {
        const confirmed = window.confirm(
            `Delete "${activeProjectName}"? This cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        await deleteProject(activeProjectId);
    };

    useEffect(() => {
        if (!shareMessage && !revisionMessage && !quickActionMessage) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setShareMessage(null);
            setRevisionMessage(null);
        }, 2800);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [quickActionMessage, revisionMessage, shareMessage]);

    const leftChrome = (
        <>
                <div style={styles.group} ref={containerRef}>
                    <button
                        type="button"
                        style={styles.projectButton}
                        disabled={isBusy}
                        onClick={() => {
                            setMoreMenuOpen(false);
                            setMenuOpen(current => !current);
                        }}
                        aria-haspopup="menu"
                        aria-expanded={menuOpen}
                        title="Project name and file actions"
                    >
                        <span style={styles.projectLabel}>Project</span>
                        <span style={styles.projectName}>{activeProjectName}</span>
                        <span style={styles.chevron}>{menuOpen ? "▴" : "▾"}</span>
                    </button>

                    {menuOpen && (
                        <div style={styles.menu} role="menu">
                            <PermissionGuard action="projects.create">
                                <button
                                    type="button"
                                    style={menuStyles.item}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void createNewProject();
                                    }}
                                >
                                    New project
                                </button>
                            </PermissionGuard>
                            <PermissionGuard action="projects.view">
                                <button
                                    type="button"
                                    style={menuStyles.item}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        openManager();
                                    }}
                                >
                                    Open project
                                </button>
                            </PermissionGuard>

                            <MenuDivider />

                            <PermissionGuard action="projects.edit">
                                <button
                                    type="button"
                                    style={menuStyles.item}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void saveActiveProject().then(() => {
                                            setRevisionMessage("Project saved");
                                        });
                                    }}
                                >
                                    Save
                                </button>
                            </PermissionGuard>
                            <PermissionGuard action="projects.edit">
                                <button
                                    type="button"
                                    style={menuStyles.item}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void saveRevision().then(revision => {
                                            if (revision) {
                                                setRevisionMessage(`Saved v${revision.versionNumber}`);
                                            }
                                        });
                                    }}
                                >
                                    Save revision
                                </button>
                            </PermissionGuard>

                            <MenuDivider />

                            <PermissionGuard action="projects.edit">
                                <button
                                    type="button"
                                    style={menuStyles.item}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void handleRenameProject();
                                    }}
                                >
                                    Rename
                                </button>
                            </PermissionGuard>
                            <PermissionGuard action="projects.delete">
                                <button
                                    type="button"
                                    style={menuStyles.item}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void handleDeleteProject();
                                    }}
                                >
                                    Delete
                                </button>
                            </PermissionGuard>

                            <MenuDivider />

                            <MenuSection label="Exports" />
                            <PermissionGuard action="quotes.export">
                                <button
                                    type="button"
                                    style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void handleExportQuotePdf();
                                    }}
                                >
                                    Quote PDF
                                </button>
                            </PermissionGuard>
                            <PermissionGuard action="manufacturing.export">
                                <button
                                    type="button"
                                    style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void handleExportManufacturingPdf();
                                    }}
                                >
                                    Manufacturing PDF
                                </button>
                            </PermissionGuard>
                            <PermissionGuard action="manufacturing.export">
                                <button
                                    type="button"
                                    style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        void handleExportManufacturingJson();
                                    }}
                                >
                                    Manufacturing JSON
                                </button>
                            </PermissionGuard>
                        </div>
                    )}
                </div>

                <EditorModeIndicator />

                {(shareMessage || revisionMessage || quickActionMessage) && (
                    <span style={styles.shareMessage}>
                        {shareMessage
                            ?? revisionMessage
                            ?? quickActionMessage}
                    </span>
                )}
        </>
    );

    const rightChrome = (
        <>
                <div style={styles.primaryActions}>
                    <PermissionGuard action="projects.edit">
                        <button
                            type="button"
                            style={styles.saveButton}
                            disabled={isBusy}
                            title="Save project"
                            onClick={() => void saveActiveProject()}
                        >
                            Save
                        </button>
                    </PermissionGuard>

                    <PermissionGuard action="projects.edit">
                        <button
                            type="button"
                            style={styles.shareButton}
                            disabled={isBusy}
                            title="Copy client review link"
                            onClick={() => void handleShare()}
                        >
                            Share
                        </button>
                    </PermissionGuard>

                    <PermissionGuard action="quotes.export">
                        <button
                            type="button"
                            style={styles.actionButton}
                            disabled={isBusy}
                            title="Download quote PDF"
                            onClick={() => void handleExportQuotePdf()}
                        >
                            Quote
                        </button>
                    </PermissionGuard>

                    <PermissionGuard action="projects.view">
                        <button
                            type="button"
                            style={styles.actionButton}
                            disabled={isBusy}
                            title="Customer-facing presentation preview"
                            onClick={enterPresentationMode}
                        >
                            Preview
                        </button>
                    </PermissionGuard>

                    <div style={styles.group} ref={moreContainerRef}>
                        <button
                            type="button"
                            style={styles.actionButton}
                            disabled={isBusy}
                            title="Templates, reviews, admin, and more"
                            onClick={() => {
                                setMenuOpen(false);
                                setMoreMenuOpen(current => !current);
                            }}
                            aria-haspopup="menu"
                            aria-expanded={moreMenuOpen}
                        >
                            More ▾
                        </button>

                        {moreMenuOpen && (
                            <div style={styles.moreMenu} role="menu">
                                <MenuSection label="Design Tools" />
                                <PermissionGuard action="projects.create">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openTemplateGallery();
                                        }}
                                    >
                                        Templates
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="projects.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            onOpenComponentLibrary?.();
                                        }}
                                    >
                                        Component library
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="projects.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            onOpenMockups?.();
                                        }}
                                    >
                                        Mockups
                                    </button>
                                </PermissionGuard>

                                <MenuDivider />
                                <MenuSection label="Collaboration" />
                                <PermissionGuard action="projects.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            showReviews();
                                        }}
                                    >
                                        Reviews
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="settings.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openAdmin("customers");
                                        }}
                                    >
                                        Customers
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="projects.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            void handleShare();
                                        }}
                                    >
                                        Share links
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="settings.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openAssignCustomer();
                                        }}
                                    >
                                        Assign customer
                                    </button>
                                </PermissionGuard>

                                <MenuDivider />
                                <MenuSection label="Tools" />
                                <PermissionGuard action="projects.view">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openARPreview();
                                        }}
                                    >
                                        AR preview
                                    </button>
                                </PermissionGuard>

                                <MenuDivider />
                                <MenuSection label="Administration" />
                                <PermissionGuard action="settings.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openAdmin("erp");
                                        }}
                                    >
                                        ERP
                                    </button>
                                </PermissionGuard>
                                {canManageUsers && (
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openUsers();
                                        }}
                                    >
                                        Users & roles
                                    </button>
                                )}
                                <PermissionGuard action="settings.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openAdmin("dashboard");
                                        }}
                                    >
                                        Analytics
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="settings.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openAdmin("company");
                                        }}
                                    >
                                        Company settings
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="settings.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openAdmin("activity");
                                        }}
                                    >
                                        Activity logs
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard action="projects.edit">
                                    <button
                                        type="button"
                                        style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                        disabled={isBusy}
                                        onClick={() => {
                                            closeMenus();
                                            openAdmin("components");
                                        }}
                                    >
                                        Catalog management
                                    </button>
                                </PermissionGuard>
                                <button
                                    type="button"
                                    style={{ ...menuStyles.item, ...menuStyles.itemIndented }}
                                    disabled={isBusy}
                                    onClick={() => {
                                        closeMenus();
                                        window.open("/portal", "_blank", "noopener,noreferrer");
                                    }}
                                >
                                    Customer portal
                                </button>
                            </div>
                        )}
                    </div>
                </div>
        </>
    );

    const chrome = renderLayout
        ? renderLayout(leftChrome, rightChrome)
        : (
            <>
                <div className="project-chrome-left">{leftChrome}</div>
                <div className="project-chrome-right">{rightChrome}</div>
            </>
        );

    return (
        <PdfExportErrorBoundary
            resetKeys={[exportBoundaryError?.message ?? null]}
            onReset={() => setExportBoundaryError(null)}
        >
            <AsyncErrorTrigger error={exportBoundaryError} />
            {chrome}
        </PdfExportErrorBoundary>
    );
}

const styles = {
    primaryActions: {
        display: "flex",
        flexWrap: "nowrap",
        alignItems: "stretch",
        gap: 6,
        height: "100%"
    },
    group: {
        position: "relative"
    },
    projectButton: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 0,
        maxWidth: "min(360px, 100%)",
        border: "1px solid #3b414a",
        background: "#20242b",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        cursor: "pointer",
        font: "inherit",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        boxSizing: "border-box"
    },
    projectLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    projectName: {
        flex: 1,
        textAlign: "left",
        fontSize: 14,
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    chevron: {
        color: "#c5cad3",
        fontSize: 12
    },
    menu: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        minWidth: "100%",
        background: "#20242b",
        border: "1px solid #3b414a",
        borderRadius: 8,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
        overflow: "hidden",
        display: "grid"
    },
    moreMenu: {
        position: "fixed",
        top: MORE_MENU_TOP,
        right: MORE_MENU_RIGHT,
        left: "auto",
        minWidth: 240,
        maxHeight: `calc(100vh - ${MORE_MENU_TOP + PANEL_SECTION_GAP}px)`,
        overflowY: "auto",
        zIndex: 13,
        background: "#20242b",
        border: "1px solid #3b414a",
        borderRadius: 8,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
        display: "grid"
    },
    saveButton: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        boxSizing: "border-box"
    },
    actionButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        boxSizing: "border-box"
    },
    shareButton: {
        border: "1px solid #4b5562",
        background: "#253040",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        boxSizing: "border-box"
    },
    revisionButton: {
        border: "1px solid #4b5562",
        background: "#2a3340",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: `0 ${TOOLBAR_CONTROL_PADDING_X}px`,
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        boxSizing: "border-box"
    },
    shareMessage: {
        pointerEvents: "none",
        color: "#cbd5e1",
        fontSize: 12,
        background: "rgba(32, 36, 43, 0.92)",
        border: "1px solid #3b414a",
        borderRadius: 999,
        padding: "6px 10px"
    }
} satisfies Record<string, import("react").CSSProperties>;
