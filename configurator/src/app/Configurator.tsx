import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StandCanvas } from "../scene/StandCanvas";
import { performanceService } from "../services/system";
import { isSupabaseConfigured } from "../services/cloud";
import { PermissionsProvider, usePermissions } from "../ui/auth";
import { SettingsProvider } from "../ui/settings";
import { EditorErrorBoundary, LoadingOverlay } from "../ui/system";
import { ArtworkDropZone } from "../ui/ArtworkDropZone";
import { ArtworkEditor } from "../ui/ArtworkEditor";
import { Inspector } from "../ui/Inspector";
import { LeftSidebar } from "../ui/LeftSidebar";
import {
    ProjectManager,
    ProjectSessionProvider,
    ProjectToolbar,
    useProjectSession
} from "../ui/projects";
import { useEditorStore } from "../store/editorStore";
import { ReviewDesignerPanel } from "../ui/reviews";
import { ARPreviewProvider, useARPreview } from "../ui/ar";
import { AppShellProvider, useAppShell } from "../ui/shell";
import { TemplateGallery } from "../ui/templates";
import { disableLocalDemoMode, isLocalDemoMode } from "./localDemoMode";

function ConfiguratorShell() {
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const modulesById = useEditorStore(state => state.modulesById);
    const { can } = usePermissions();
    const { isOpen: isARPreviewOpen } = useARPreview();
    const { reviewsVisible } = useAppShell();
    const {
        isTemplateGalleryOpen,
        closeTemplateGallery,
        createProjectFromTemplate,
        createTemplateFromCurrentProject,
        isBusy
    } = useProjectSession();
    const navigate = useNavigate();
    const showLocalModeBadge = !isSupabaseConfigured() && isLocalDemoMode();

    useEffect(() => {
        performanceService.recordSceneObjectCount(Object.keys(modulesById).length);
    }, [modulesById]);

    const handleExitWorkspace = () => {
        if (!isSupabaseConfigured()) {
            disableLocalDemoMode();
        }

        navigate("/", { replace: true });
    };

    return (
        <EditorErrorBoundary>
            <div
                style={{
                    width: "100vw",
                    height: "100vh",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {!isARPreviewOpen && (
                    <div style={styles.workspaceHeader}>
                        <div style={styles.workspaceMeta}>
                            <span style={styles.workspaceTitle}>Workspace</span>
                            {showLocalModeBadge && (
                                <span style={styles.localBadge}>Local Mode</span>
                            )}
                            <Link to="/portal" style={styles.portalLink}>
                                Customer portal
                            </Link>
                        </div>
                        <button
                            type="button"
                            style={styles.exitWorkspaceButton}
                            onClick={handleExitWorkspace}
                        >
                            Exit workspace
                        </button>
                    </div>
                )}
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && <LeftSidebar />}
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && <Inspector />}
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && reviewsVisible && (
                    <ReviewDesignerPanel />
                )}
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && <ArtworkDropZone />}
                {!artworkEditMode && !isARPreviewOpen && can("projects.view") && <ProjectManager />}
                {!isARPreviewOpen && <ProjectToolbar />}
                {!isARPreviewOpen && <StandCanvas />}
                {!isARPreviewOpen && can("projects.edit") && <ArtworkEditor />}
                <TemplateGallery
                    isOpen={isTemplateGalleryOpen}
                    onClose={closeTemplateGallery}
                    onUseTemplate={async templateId => {
                        await createProjectFromTemplate(templateId);
                        closeTemplateGallery();
                    }}
                    onCreateFromCurrent={createTemplateFromCurrentProject}
                    isBusy={isBusy}
                />
                <LoadingOverlay />
            </div>
        </EditorErrorBoundary>
    );
}

export function Configurator() {
    return (
        <SettingsProvider>
            <PermissionsProvider>
                <ProjectSessionProvider>
                    <ARPreviewProvider>
                        <AppShellProvider>
                            <ConfiguratorShell />
                        </AppShellProvider>
                    </ARPreviewProvider>
                </ProjectSessionProvider>
            </PermissionsProvider>
        </SettingsProvider>
    );
}

const styles = {
    workspaceHeader: {
        position: "absolute",
        top: 8,
        right: 20,
        zIndex: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        pointerEvents: "none"
    },
    workspaceMeta: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "auto"
    },
    workspaceTitle: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    localBadge: {
        fontSize: 11,
        fontWeight: 600,
        color: "#fde68a",
        border: "1px solid #854d0e",
        borderRadius: 999,
        padding: "4px 8px",
        background: "rgba(66, 32, 6, 0.45)"
    },
    portalLink: {
        fontSize: 12,
        color: "#93c5fd",
        textDecoration: "none"
    },
    exitWorkspaceButton: {
        border: "1px solid #4b5562",
        background: "rgba(45, 52, 64, 0.92)",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        pointerEvents: "auto"
    }
} satisfies Record<string, import("react").CSSProperties>;
