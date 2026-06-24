import type { StandModule } from "../models/ModuleModel";
import {
    FRAME_FABRIC_SIDES,
    getMergedFabric,
    getMergedFabricArtwork
} from "../utils/fabrics";
import type { FabricMergeLayout } from "./frameConnections";
import { FabricPanel } from "./fabricPanel";

const FABRIC_INSET = 0.003;

interface FabricSurfaceProps {
    module: StandModule;
    connectionLayout: FabricMergeLayout;
}

export function FabricSurface({
    module,
    connectionLayout
}: FabricSurfaceProps) {
    if (!connectionLayout.isLeader) {
        return null;
    }

    return (
        <>
            {FRAME_FABRIC_SIDES.map(side => {
                const fabric = getMergedFabric(side, connectionLayout.members);
                const zOffset = side === "front"
                    ? -module.depth / 2 - FABRIC_INSET
                    : module.depth / 2 + FABRIC_INSET;
                const artwork = getMergedFabricArtwork(
                    side,
                    module,
                    connectionLayout.members,
                    connectionLayout.width
                );

                return (
                    <FabricPanel
                        key={side}
                        fabric={fabric}
                        artwork={artwork}
                        panelWidth={connectionLayout.width}
                        panelHeight={module.height}
                        position={[connectionLayout.centerOffsetX, 0, zOffset]}
                        rotation={[0, side === "front" ? Math.PI : 0, 0]}
                    />
                );
            })}
        </>
    );
}
