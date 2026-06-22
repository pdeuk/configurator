import { AdditiveBlending, BackSide, DoubleSide, FrontSide } from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";
import { FabricFaceMaterial } from "./fabricMaterials";
import {
    BLOCKOUT_BACKING_COLOR,
    BLOCKOUT_BACKING_OFFSET,
    BLOCKOUT_BACKING_RENDER_ORDER,
    getFabricBackGlowMaterialProps,
    LUMINOUS_BACK_GLOW_RENDER_ORDER,
    LUMINOUS_FABRIC_RENDER_ORDER,
    LUMINOUS_GLOW_OFFSET
} from "./fabricLuminous";
import { ignoreRaycast } from "./raycast";

export interface CurvedFabricArcProps {
    fabric: FabricInfo;
    artwork: ArtworkInfo | null;
    radius: number;
    height: number;
    thetaStart: number;
    thetaLength: number;
    inward?: boolean;
}

export function CurvedFabricArc({
    fabric,
    artwork,
    radius,
    height,
    thetaStart,
    thetaLength,
    inward = false
}: CurvedFabricArcProps) {
    const isLuminous = fabric.isLuminous && !fabric.isBlockout;
    const radialSegments = Math.max(12, Math.ceil(thetaLength * 32));
    const materialSide = inward ? BackSide : FrontSide;
    const backGlowMaterialProps = getFabricBackGlowMaterialProps();
    const glowRadius = inward
        ? radius - LUMINOUS_GLOW_OFFSET
        : radius + LUMINOUS_GLOW_OFFSET;
    const backingRadius = inward
        ? radius - BLOCKOUT_BACKING_OFFSET
        : radius + BLOCKOUT_BACKING_OFFSET;

    return (
        <>
            {isLuminous && (
                <mesh
                    renderOrder={LUMINOUS_BACK_GLOW_RENDER_ORDER}
                    raycast={ignoreRaycast}
                >
                    <cylinderGeometry
                        args={[
                            glowRadius,
                            glowRadius,
                            height,
                            radialSegments,
                            1,
                            true,
                            thetaStart,
                            thetaLength
                        ]}
                    />
                    <meshBasicMaterial
                        blending={AdditiveBlending}
                        depthWrite={false}
                        {...backGlowMaterialProps}
                    />
                </mesh>
            )}
            <mesh
                renderOrder={LUMINOUS_FABRIC_RENDER_ORDER}
                raycast={ignoreRaycast}
            >
                <cylinderGeometry
                    args={[
                        radius,
                        radius,
                        height,
                        radialSegments,
                        1,
                        true,
                        thetaStart,
                        thetaLength
                    ]}
                />
                <FabricFaceMaterial
                    fabric={fabric}
                    artwork={artwork}
                    isLuminous={isLuminous}
                    side={materialSide}
                />
            </mesh>
            {fabric.isBlockout && (
                <mesh
                    renderOrder={BLOCKOUT_BACKING_RENDER_ORDER}
                    raycast={ignoreRaycast}
                >
                    <cylinderGeometry
                        args={[
                            backingRadius,
                            backingRadius,
                            height,
                            radialSegments,
                            1,
                            true,
                            thetaStart,
                            thetaLength
                        ]}
                    />
                    <meshBasicMaterial
                        color={BLOCKOUT_BACKING_COLOR}
                        side={DoubleSide}
                        toneMapped={false}
                    />
                </mesh>
            )}
        </>
    );
}
