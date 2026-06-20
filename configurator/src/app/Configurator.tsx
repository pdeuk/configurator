import { StandCanvas } from "../scene/StandCanvas";
import { ArtworkDropZone } from "../ui/ArtworkDropZone";
import { Inspector } from "../ui/Inspector";
import { LeftSidebar } from "../ui/LeftSidebar";

export function Configurator() {
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh"
            }}
        >
            <LeftSidebar />
            <Inspector />
            <ArtworkDropZone />
            <StandCanvas />
        </div>
    );
}
