import type { StandModule } from "../models/ModuleModel";
import {
    getModuleFabric,
    getModuleFabricArtwork
} from "../utils/fabrics";
import { getBoothDoorSplitY } from "../utils/wallLayout";
import { BOOTH_DOOR_FRAME_THICKNESS } from "./BoothDoorWallFrame";
import { FabricPanel } from "./fabricPanel";
import { WallFrameDoor } from "./WallFrameDoor";

const FABRIC_INSET = 0.003;

interface BoothDoorWallFabricSurfaceProps {
    module: StandModule;
}

export function BoothDoorWallFabricSurface({
    module
}: BoothDoorWallFabricSurfaceProps) {
    const rail = Math.min(
        BOOTH_DOOR_FRAME_THICKNESS,
        module.width / 2,
        module.height / 2
    );
    const splitY = getBoothDoorSplitY(module);
    const halfHeight = module.height / 2;
    // Fill the opening between the bottom of the top rail and the top of the
    // split rail so the fabric matches the thinner door frame exactly.
    const openingTop = halfHeight - rail;
    const openingBottom = splitY + rail / 2;
    const topPanelHeight = Math.max(openingTop - openingBottom, 0);
    const topPanelWidth = Math.max(module.width - rail * 2, rail);
    const topCenterY = (openingTop + openingBottom) / 2;
    const halfDepth = module.depth / 2;
    const frontZ = -halfDepth - FABRIC_INSET;

    return (
        <>
            <FabricPanel
                fabric={getModuleFabric(module, "top")}
                artwork={getModuleFabricArtwork(module, "top")}
                panelWidth={topPanelWidth}
                panelHeight={topPanelHeight}
                position={[0, topCenterY, frontZ]}
                rotation={[0, Math.PI, 0]}
            />
            <WallFrameDoor module={module} />
        </>
    );
}
