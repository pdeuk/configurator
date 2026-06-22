import { AdditiveBlending, DoubleSide } from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";
import {
    BLOCKOUT_BACKING_COLOR,
    BLOCKOUT_BACKING_OFFSET,
    BLOCKOUT_BACKING_RENDER_ORDER,
    getFabricFaceGlowMaterialProps,
    LUMINOUS_FACE_GLOW_RENDER_ORDER,
    LUMINOUS_FABRIC_RENDER_ORDER
} from "./fabricLuminous";
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
    const faceGlowMaterialProps = getFabricFaceGlowMaterialProps();
    const materialSide = doubleSided ? DoubleSide : FrontSide;

    return (
        <group position={position} rotation={rotation}>
            <mesh
                renderOrder={LUMINOUS_FABRIC_RENDER_ORDER}
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
            {isLuminous && (
                <mesh
                    renderOrder={LUMINOUS_FACE_GLOW_RENDER_ORDER}
                    raycast={ignoreRaycast}
                >
                    <planeGeometry args={[panelWidth, panelHeight]} />
                    <meshBasicMaterial
                        blending={AdditiveBlending}
                        depthWrite={false}
                        {...faceGlowMaterialProps}
                    />
                </mesh>
            )}
            {fabric.isBlockout && (
                <mesh
                    position={[0, 0, -BLOCKOUT_BACKING_OFFSET]}
                    renderOrder={BLOCKOUT_BACKING_RENDER_ORDER}
                    raycast={ignoreRaycast}
                >
                    <planeGeometry args={[panelWidth, panelHeight]} />
                    <meshBasicMaterial
                        color={BLOCKOUT_BACKING_COLOR}
                        side={DoubleSide}
                        toneMapped={false}
                    />
                </mesh>
            )}
        </group>
    );
}
