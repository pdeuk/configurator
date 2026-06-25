import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { ReviewSidePanel } from "../ui/reviews";
import { WorkspaceAccountPanel } from "../ui/shell/WorkspaceAccountPanel";
import { ARPreviewProvider, useARPreview } from "../ui/ar";
import { AppShellProvider, ComponentRowAlignProvider, useAppShell } from "../ui/shell";
import { useComponentRowAlign } from "../ui/shell/ComponentRowAlign";
import { MobileChrome } from "../ui/shell/MobileChrome";
import { MobileWorkspace } from "../ui/shell/MobileWorkspace";
import { useIsMobile } from "../ui/shell/useIsMobile";
import { RightPanelColumn } from "../ui/shell/RightPanelColumn";
import { WorkspaceChrome } from "../ui/shell/WorkspaceChrome";
import { SelectionActionBar } from "../ui/shell/SelectionActionBar";
import {
    PresentationModeProvider,
    usePresentationMode
} from "../ui/presentation/PresentationModeContext";
import { TemplateGallery } from "../ui/templates";
import { disableLocalDemoMode } from "./localDemoMode";

function ConfiguratorShell() {
    const { registerViewport } = useComponentRowAlign();
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const modulesById = useEditorStore(state => state.modulesById);
    const { can, isGuestMode } = usePermissions();
    const { isOpen: isARPreviewOpen } = useARPreview();
    const { reviewsVisible, hideReviews } = useAppShell();
    const { isPresentationMode, exitPresentationMode } = usePresentationMode();
    const {
        isTemplateGalleryOpen,
        closeTemplateGallery,
        createProjectFromTemplate,
        createTemplateFromCurrentProject,
        isBusy
    } = useProjectSession();
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [mockupsOpen, setMockupsOpen] = useState(false);

    useEffect(() => {
        performanceService.recordSceneObjectCount(Object.keys(modulesById).length);
    }, [modulesById]);

    const handleExitWorkspace = () => {
        if (!isSupabaseConfigured()) {
            disableLocalDemoMode();
        }

        navigate("/", { replace: true });
    };

    const showRightPanel =
        !isARPreviewOpen
        && !isPresentationMode
        && can("projects.view");

    const showEditorChrome =
        showRightPanel
        && can("projects.edit")
        && !artworkEditMode;

    return (
        <EditorErrorBoundary>
            <div
                ref={registerViewport}
                style={{
                    width: "100vw",
                    height: "100vh",
                    position: "relative",
                    overflow: "hidden"
                }}
            >
                {isPresentationMode && (
                    <div style={styles.presentationBar}>
                        <span style={styles.presentationLabel}>Presentation preview</span>
                        <button
                            type="button"
                            style={styles.exitPresentationButton}
                            onClick={exitPresentationMode}
                        >
                            Exit presentation mode
                        </button>
                    </div>
                )}

                {!isMobile && (
                    <>
                        {showEditorChrome && (
                            <LeftSidebar
                                libraryOpen={libraryOpen}
                                mockupsOpen={mockupsOpen}
                                onLibraryOpenChange={setLibraryOpen}
                                onMockupsOpenChange={setMockupsOpen}
                            />
                        )}
                        {showRightPanel && (
                            <RightPanelColumn>
                                {showEditorChrome && <Inspector />}
                                <WorkspaceAccountPanel onExit={handleExitWorkspace} />
                            </RightPanelColumn>
                        )}
                        {!isARPreviewOpen && !isPresentationMode && (
                            <ProjectToolbar
                                onOpenComponentLibrary={() => setLibraryOpen(true)}
                                onOpenMockups={() => setMockupsOpen(true)}
                                renderLayout={(left, right) => (
                                    <WorkspaceChrome
                                        left={left}
                                        center={showEditorChrome ? <ArtworkDropZone /> : null}
                                        right={right}
                                    />
                                )}
                            />
                        )}
                    </>
                )}
                {!isMobile && !isARPreviewOpen && !isPresentationMode && !isGuestMode && can("projects.view") && (
                    <ReviewSidePanel open={reviewsVisible} onClose={hideReviews} />
                )}
                {isMobile && !isARPreviewOpen && !isPresentationMode && can("projects.view") && (
                    <MobileChrome>
                        <MobileWorkspace onExit={handleExitWorkspace} />
                    </MobileChrome>
                )}
                {!isARPreviewOpen && !isPresentationMode && can("projects.view") && <ProjectManager />}
                {!isARPreviewOpen && <StandCanvas />}
                {showEditorChrome && <SelectionActionBar />}
                {!isARPreviewOpen && !isPresentationMode && can("projects.edit") && <ArtworkEditor />}
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

export function Configurator({ guestMode = false }: { guestMode?: boolean }) {
    return (
        <SettingsProvider>
            <PermissionsProvider guestMode={guestMode}>
                <ProjectSessionProvider>
                    <PresentationModeProvider>
                        <ARPreviewProvider>
                            <AppShellProvider>
                                <ComponentRowAlignProvider>
                                    <ConfiguratorShell />
                                </ComponentRowAlignProvider>
                            </AppShellProvider>
                        </ARPreviewProvider>
                    </PresentationModeProvider>
                </ProjectSessionProvider>
            </PermissionsProvider>
        </SettingsProvider>
    );
}

const styles = {
    presentationBar: {
        position: "absolute",
        top: 16,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 14,
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 14px",
        borderRadius: 999,
        border: "1px solid #3b414a",
        background: "rgba(32, 36, 43, 0.94)",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)"
    },
    presentationLabel: {
        fontSize: 13,
        color: "#cbd5e1"
    },
    exitPresentationButton: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 999,
        padding: "8px 14px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    }
} satisfies Record<string, import("react").CSSProperties>;
