import { StandCanvas } from "../scene/StandCanvas";
import { ArtworkDropZone } from "../ui/ArtworkDropZone";
import { Inspector } from "../ui/Inspector";
import { Toolbar } from "../ui/Toolbar";

export function Configurator() {
    return (
        <div
            style={{
                width: "100vw",
                height: "100vh"
            }}
        >
            <Toolbar />
            <Inspector />
            <ArtworkDropZone />
            <StandCanvas />
        </div>
    );
}
