import { StandCanvas } from "../scene/StandCanvas";
import { ArtworkDropZone } from "../ui/ArtworkDropZone";
import { ArtworkEditor } from "../ui/ArtworkEditor";
import { Inspector } from "../ui/Inspector";
import { LeftSidebar } from "../ui/LeftSidebar";
import { useEditorStore } from "../store/editorStore";

export function Configurator() {
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);

    return (
        <div
            style={{
                width: "100vw",
                height: "100vh",
                position: "relative",
                overflow: "hidden"
            }}
        >
            {!artworkEditMode && <LeftSidebar />}
            {!artworkEditMode && <Inspector />}
            {!artworkEditMode && <ArtworkDropZone />}
            <StandCanvas />
            <ArtworkEditor />
        </div>
    );
}
