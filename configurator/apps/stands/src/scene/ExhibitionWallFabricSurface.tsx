import type { StandModule } from "../models/ModuleModel";
import {
    createBannerFabricSide,
    getModuleFabric,
    getModuleFabricArtwork
} from "../utils/fabrics";
import {
    getExhibitionWallSegmentCenterX,
    getExhibitionWallSegmentCount,
    getExhibitionWallSegmentWidth
} from "../utils/exhibitionWallGeometry";
import { FabricPanel } from "./fabricPanel";

const FABRIC_INSET = 0.003;

interface ExhibitionWallFabricSurfaceProps {
    module: StandModule;
}

export function ExhibitionWallFabricSurface({
    module
}: ExhibitionWallFabricSurfaceProps) {
    const segmentCount = getExhibitionWallSegmentCount(module);
    const segmentWidth = getExhibitionWallSegmentWidth(module);
    const halfDepth = module.depth / 2;

    return (
        <>
            {Array.from({ length: segmentCount }, (_, index) => {
                const centerX = getExhibitionWallSegmentCenterX(module, index);
                const outsideSide = createBannerFabricSide("outside", index);
                const insideSide = createBannerFabricSide("inside", index);

                return (
                    <group key={index}>
                        <FabricPanel
                            fabric={getModuleFabric(module, outsideSide)}
                            artwork={getModuleFabricArtwork(module, outsideSide)}
                            panelWidth={segmentWidth}
                            panelHeight={module.height}
                            position={[centerX, 0, -halfDepth - FABRIC_INSET]}
                            rotation={[0, Math.PI, 0]}
                        />
                        <FabricPanel
                            fabric={getModuleFabric(module, insideSide)}
                            artwork={getModuleFabricArtwork(module, insideSide)}
                            panelWidth={segmentWidth}
                            panelHeight={module.height}
                            position={[centerX, 0, halfDepth + FABRIC_INSET]}
                            rotation={[0, 0, 0]}
                        />
                    </group>
                );
            })}
        </>
    );
}
