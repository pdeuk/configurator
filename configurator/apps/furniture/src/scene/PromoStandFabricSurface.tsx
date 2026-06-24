import type { PromoStandFabricSide, StandModule } from "../models/ModuleModel";
import {
    getFabricDimensions,
    getModuleFabric,
    getModuleFabricArtwork,
    getRailThickness
} from "../utils/fabrics";
import { FabricPanel } from "./fabricPanel";
import { PromoStandBackDoors } from "./PromoStandBackDoors";
import { PromoStandMelamineShelf } from "./PromoStandMelamineShelf";
import { PromoStandMelamineTop } from "./PromoStandMelamineTop";

const FABRIC_INSET = 0.003;
const EXTERIOR_SIDES: PromoStandFabricSide[] = ["front", "left", "right"];

interface PromoStandFabricSurfaceProps {
    module: StandModule;
}

interface PromoStandFaceLayout {
    side: PromoStandFabricSide;
    panelWidth: number;
    panelHeight: number;
    position: [number, number, number];
    rotation: [number, number, number];
}

function getExteriorFaceLayout(
    module: StandModule,
    side: PromoStandFabricSide
): PromoStandFaceLayout {
    const dimensions = getFabricDimensions(module, side);
    const halfWidth = module.width / 2;
    const halfDepth = module.depth / 2;

    switch (side) {
        case "front":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, -halfDepth - FABRIC_INSET],
                rotation: [0, Math.PI, 0]
            };
        case "left":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [-halfWidth - FABRIC_INSET, 0, 0],
                rotation: [0, -Math.PI / 2, 0]
            };
        case "right":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [halfWidth + FABRIC_INSET, 0, 0],
                rotation: [0, Math.PI / 2, 0]
            };
        default:
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, 0],
                rotation: [0, 0, 0]
            };
    }
}

function PromoStandInsideFabric({ module }: { module: StandModule }) {
    const rail = getRailThickness(module);
    const halfWidth = module.width / 2;
    const innerDepth = Math.max(module.depth - rail * 2, rail);
    const innerHeight = Math.max(module.height - rail * 2, rail);
    const leftX = -halfWidth + rail + FABRIC_INSET;
    const rightX = halfWidth - rail - FABRIC_INSET;

    const fabric = getModuleFabric(module, "inside");
    const artwork = getModuleFabricArtwork(module, "inside");

    return (
        <>
            <FabricPanel
                key="inside-left"
                fabric={fabric}
                artwork={artwork}
                panelWidth={innerDepth}
                panelHeight={innerHeight}
                position={[leftX, 0, 0]}
                rotation={[0, -Math.PI / 2, 0]}
                doubleSided
            />
            <FabricPanel
                key="inside-right"
                fabric={fabric}
                artwork={artwork}
                panelWidth={innerDepth}
                panelHeight={innerHeight}
                position={[rightX, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                doubleSided
            />
        </>
    );
}

export function PromoStandFabricSurface({ module }: PromoStandFabricSurfaceProps) {
    return (
        <>
            {EXTERIOR_SIDES.map(side => {
                const layout = getExteriorFaceLayout(module, side);
                const fabric = getModuleFabric(module, side);
                const artwork = getModuleFabricArtwork(module, side);

                return (
                    <FabricPanel
                        key={side}
                        fabric={fabric}
                        artwork={artwork}
                        panelWidth={layout.panelWidth}
                        panelHeight={layout.panelHeight}
                        position={layout.position}
                        rotation={layout.rotation}
                    />
                );
            })}
            <PromoStandInsideFabric module={module} />
            <PromoStandMelamineShelf module={module} />
            <PromoStandMelamineTop module={module} />
            <PromoStandBackDoors module={module} />
        </>
    );
}
