import type { StandModule } from "../models/ModuleModel";
import {
    createBannerFabricSide,
    getModuleFabric,
    getModuleFabricArtwork
} from "../utils/fabrics";
import {
    getSquareBannerInnerHalf,
    getSquareBannerOuterHalf,
    getSquareBannerSegmentCenter,
    getSquareBannerSegmentWidthForLayer,
    getSquareBannerSegments
} from "../utils/bannerGeometry";
import { FabricPanel } from "./fabricPanel";

const FABRIC_INSET = 0.003;

interface SquareBannerFabricSurfaceProps {
    module: StandModule;
}

function getSquareFabricPlacement(
    rotationY: number,
    layer: "outside" | "inside",
    centerX: number,
    centerZ: number,
    outerHalf: number,
    innerHalf: number
) {
    if (rotationY === 0) {
        const z = layer === "outside"
            ? -outerHalf - FABRIC_INSET
            : -innerHalf + FABRIC_INSET;

        return {
            position: [centerX, 0, z] as [number, number, number],
            rotation: (layer === "outside" ? [0, Math.PI, 0] : [0, 0, 0]) as [number, number, number]
        };
    }

    if (rotationY === -Math.PI / 2) {
        const x = layer === "outside"
            ? outerHalf + FABRIC_INSET
            : innerHalf - FABRIC_INSET;

        return {
            position: [x, 0, centerZ] as [number, number, number],
            rotation: (layer === "outside"
                ? [0, Math.PI / 2, 0]
                : [0, -Math.PI / 2, 0]) as [number, number, number]
        };
    }

    if (rotationY === Math.PI) {
        const z = layer === "outside"
            ? outerHalf + FABRIC_INSET
            : innerHalf - FABRIC_INSET;

        return {
            position: [centerX, 0, z] as [number, number, number],
            rotation: (layer === "outside" ? [0, 0, 0] : [0, Math.PI, 0]) as [number, number, number]
        };
    }

    const x = layer === "outside"
        ? -outerHalf - FABRIC_INSET
        : -innerHalf + FABRIC_INSET;

    return {
        position: [x, 0, centerZ] as [number, number, number],
        rotation: (layer === "outside"
            ? [0, -Math.PI / 2, 0]
            : [0, Math.PI / 2, 0]) as [number, number, number]
    };
}

export function SquareBannerFabricSurface({
    module
}: SquareBannerFabricSurfaceProps) {
    const segments = getSquareBannerSegments(module);
    const outerHalf = getSquareBannerOuterHalf(module);
    const innerHalf = getSquareBannerInnerHalf(module);
    const outsidePanelWidth = getSquareBannerSegmentWidthForLayer(module, "outside");
    const insidePanelWidth = getSquareBannerSegmentWidthForLayer(module, "inside");

    return (
        <>
            {segments.map(segment => {
                const outsideSide = createBannerFabricSide("outside", segment.index);
                const insideSide = createBannerFabricSide("inside", segment.index);
                const outsideCenter = getSquareBannerSegmentCenter(module, segment.index, "outside");
                const insideCenter = getSquareBannerSegmentCenter(module, segment.index, "inside");
                const outsidePlacement = getSquareFabricPlacement(
                    outsideCenter.rotationY,
                    "outside",
                    outsideCenter.x,
                    outsideCenter.z,
                    outerHalf,
                    innerHalf
                );
                const insidePlacement = getSquareFabricPlacement(
                    insideCenter.rotationY,
                    "inside",
                    insideCenter.x,
                    insideCenter.z,
                    outerHalf,
                    innerHalf
                );

                return (
                    <group key={segment.index}>
                        <FabricPanel
                            fabric={getModuleFabric(module, outsideSide)}
                            artwork={getModuleFabricArtwork(module, outsideSide)}
                            panelWidth={outsidePanelWidth}
                            panelHeight={module.height}
                            position={outsidePlacement.position}
                            rotation={outsidePlacement.rotation}
                        />
                        <FabricPanel
                            fabric={getModuleFabric(module, insideSide)}
                            artwork={getModuleFabricArtwork(module, insideSide)}
                            panelWidth={insidePanelWidth}
                            panelHeight={module.height}
                            position={insidePlacement.position}
                            rotation={insidePlacement.rotation}
                        />
                    </group>
                );
            })}
        </>
    );
}
