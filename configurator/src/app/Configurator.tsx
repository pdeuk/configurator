import { useEffect } from "react";
import { StandCanvas } from "../scene/StandCanvas";
import { performanceService } from "../services/system";
import { PermissionsProvider, usePermissions } from "../ui/auth";
import { CloudSessionProvider } from "../ui/cloud";
import { SettingsProvider } from "../ui/settings";
import { EditorErrorBoundary, LoadingOverlay } from "../ui/system";
import { ArtworkDropZone } from "../ui/ArtworkDropZone";
import { ArtworkEditor } from "../ui/ArtworkEditor";
import { Inspector } from "../ui/Inspector";
import { LeftSidebar } from "../ui/LeftSidebar";
import {
    ProjectManager,
    ProjectSessionProvider,
    ProjectToolbar
} from "../ui/projects";
import { useEditorStore } from "../store/editorStore";
import { ReviewDesignerPanel } from "../ui/reviews";
import { ARPreviewProvider, useARPreview } from "../ui/ar";

function ConfiguratorShell() {
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const modulesById = useEditorStore(state => state.modulesById);
    const { can } = usePermissions();
    const { isOpen: isARPreviewOpen } = useARPreview();

    useEffect(() => {
        performanceService.recordSceneObjectCount(Object.keys(modulesById).length);
    }, [modulesById]);

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
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && <LeftSidebar />}
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && <Inspector />}
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && <ReviewDesignerPanel />}
                {!artworkEditMode && !isARPreviewOpen && can("projects.edit") && <ArtworkDropZone />}
                {!artworkEditMode && !isARPreviewOpen && can("projects.view") && <ProjectManager />}
                {!isARPreviewOpen && <ProjectToolbar />}
                {!isARPreviewOpen && <StandCanvas />}
                {!isARPreviewOpen && can("projects.edit") && <ArtworkEditor />}
                <LoadingOverlay />
            </div>
        </EditorErrorBoundary>
    );
}

export function Configurator() {
    return (
        <CloudSessionProvider>
            <SettingsProvider>
                <PermissionsProvider>
                    <ProjectSessionProvider>
                        <ARPreviewProvider>
                            <ConfiguratorShell />
                        </ARPreviewProvider>
                    </ProjectSessionProvider>
                </PermissionsProvider>
            </SettingsProvider>
        </CloudSessionProvider>
    );
}
