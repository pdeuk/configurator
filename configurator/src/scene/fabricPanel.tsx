import { DoubleSide } from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";
import { BlockoutBackingPlane } from "./fabricBlockout";
import { LUMINOUS_FABRIC_RENDER_ORDER } from "./fabricLuminous";
import { LuminousBacklightPlane } from "./fabricLuminousBacklight";
import { FabricFaceMaterial, FrontSide } from "./fabricMaterials";
import { ignoreRaycast } from "./raycast";

export interface FabricPanelProps {
    fabric: FabricInfo;
    artwork: ArtworkInfo | null;
    panelWidth: number;
    panelHeight: number;
    position: [number, number, number];
    rotation: [number, number, number];
    doubleSided?: boolean;
}

export function FabricPanel({
    fabric,
    artwork,
    panelWidth,
    panelHeight,
    position,
    rotation,
    doubleSided = false
}: FabricPanelProps) {
    const isLuminous = fabric.isLuminous && !fabric.isBlockout;
    const materialSide = doubleSided ? DoubleSide : FrontSide;

    return (
        <group position={position} rotation={rotation}>
            {isLuminous && (
                <LuminousBacklightPlane
                    panelWidth={panelWidth}
                    panelHeight={panelHeight}
                    rotation={rotation}
                />
            )}
            {fabric.isBlockout && (
                <BlockoutBackingPlane
                    panelWidth={panelWidth}
                    panelHeight={panelHeight}
                    rotation={rotation}
                    doubleSided={doubleSided}
                />
            )}
            <mesh
                renderOrder={isLuminous ? LUMINOUS_FABRIC_RENDER_ORDER : 1}
                raycast={ignoreRaycast}
            >
                <planeGeometry args={[panelWidth, panelHeight]} />
                <FabricFaceMaterial
                    fabric={fabric}
                    artwork={artwork}
                    isLuminous={isLuminous}
                    side={materialSide}
                />
            </mesh>
        </group>
    );
}
