import type { CubeFabricSide, StandModule } from "../models/ModuleModel";
import {
    CUBE_FABRIC_SIDES,
    getFabricDimensions,
    getModuleFabric,
    getModuleFabricArtwork
} from "../utils/fabrics";
import { FabricPanel } from "./fabricPanel";

const FABRIC_INSET = 0.003;
const BACKLIGHT_OFFSET = 0.045;
const GLOW_OFFSET = 0.009;

interface CubeFabricSurfaceProps {
    module: StandModule;
}

interface CubeFaceLayout {
    side: CubeFabricSide;
    panelWidth: number;
    panelHeight: number;
    position: [number, number, number];
    rotation: [number, number, number];
    backlightPosition: [number, number, number];
    backlightRotation: [number, number, number];
    glowPosition: [number, number, number];
    glowRotation: [number, number, number];
}

function getCubeFaceLayout(module: StandModule, side: CubeFabricSide): CubeFaceLayout {
    const dimensions = getFabricDimensions(module, side);
    const halfWidth = module.width / 2;
    const halfHeight = module.height / 2;
    const halfDepth = module.depth / 2;

    switch (side) {
        case "front":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, -halfDepth - FABRIC_INSET],
                rotation: [0, Math.PI, 0],
                backlightPosition: [0, 0, -halfDepth + BACKLIGHT_OFFSET],
                backlightRotation: [0, 0, 0],
                glowPosition: [0, 0, -halfDepth - GLOW_OFFSET],
                glowRotation: [0, Math.PI, 0]
            };
        case "back":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, halfDepth + FABRIC_INSET],
                rotation: [0, 0, 0],
                backlightPosition: [0, 0, halfDepth - BACKLIGHT_OFFSET],
                backlightRotation: [0, Math.PI, 0],
                glowPosition: [0, 0, halfDepth + GLOW_OFFSET],
                glowRotation: [0, 0, 0]
            };
        case "left":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [-halfWidth - FABRIC_INSET, 0, 0],
                rotation: [0, -Math.PI / 2, 0],
                backlightPosition: [-halfWidth + BACKLIGHT_OFFSET, 0, 0],
                backlightRotation: [0, -Math.PI / 2, 0],
                glowPosition: [-halfWidth - GLOW_OFFSET, 0, 0],
                glowRotation: [0, -Math.PI / 2, 0]
            };
        case "right":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [halfWidth + FABRIC_INSET, 0, 0],
                rotation: [0, Math.PI / 2, 0],
                backlightPosition: [halfWidth - BACKLIGHT_OFFSET, 0, 0],
                backlightRotation: [0, Math.PI / 2, 0],
                glowPosition: [halfWidth + GLOW_OFFSET, 0, 0],
                glowRotation: [0, Math.PI / 2, 0]
            };
        case "top":
            return {
                side,
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, halfHeight + FABRIC_INSET, 0],
                rotation: [-Math.PI / 2, 0, 0],
                backlightPosition: [0, halfHeight - BACKLIGHT_OFFSET, 0],
                backlightRotation: [-Math.PI / 2, 0, 0],
                glowPosition: [0, halfHeight + GLOW_OFFSET, 0],
                glowRotation: [-Math.PI / 2, 0, 0]
            };
    }
}

export function CubeFabricSurface({ module }: CubeFabricSurfaceProps) {
    return (
        <>
            {CUBE_FABRIC_SIDES.map(side => {
                const layout = getCubeFaceLayout(module, side);
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
                        backlightPosition={layout.backlightPosition}
                        backlightRotation={layout.backlightRotation}
                        glowPosition={layout.glowPosition}
                        glowRotation={layout.glowRotation}
                    />
                );
            })}
        </>
    );
}
