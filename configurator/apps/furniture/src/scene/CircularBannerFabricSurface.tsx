import type { StandModule } from "../models/ModuleModel";
import {
    createBannerFabricSide,
    getModuleFabric,
    getModuleFabricArtwork
} from "../utils/fabrics";
import { getBannerArcSegments } from "../utils/bannerGeometry";
import { CurvedFabricArc } from "./CurvedFabricArc";

const FABRIC_INSET = 0.003;

interface CircularBannerFabricSurfaceProps {
    module: StandModule;
}

export function CircularBannerFabricSurface({
    module
}: CircularBannerFabricSurfaceProps) {
    const segments = getBannerArcSegments(module);

    return (
        <>
            {segments.map(segment => {
                const outsideSide = createBannerFabricSide("outside", segment.index);
                const insideSide = createBannerFabricSide("inside", segment.index);

                return (
                    <group key={segment.index}>
                        <CurvedFabricArc
                            fabric={getModuleFabric(module, outsideSide)}
                            artwork={getModuleFabricArtwork(module, outsideSide)}
                            radius={segment.outerRadius - FABRIC_INSET}
                            height={module.height}
                            thetaStart={segment.thetaStart}
                            thetaLength={segment.thetaLength}
                        />
                        <CurvedFabricArc
                            fabric={getModuleFabric(module, insideSide)}
                            artwork={getModuleFabricArtwork(module, insideSide)}
                            radius={segment.innerRadius + FABRIC_INSET}
                            height={module.height}
                            thetaStart={segment.thetaStart}
                            thetaLength={segment.thetaLength}
                            inward
                        />
                    </group>
                );
            })}
        </>
    );
}
