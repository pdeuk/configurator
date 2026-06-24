import { BackSide, DoubleSide, FrontSide } from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";
import { BlockoutBackingArc } from "./fabricBlockout";
import { FabricFaceMaterial } from "./fabricMaterials";
import { LUMINOUS_FABRIC_RENDER_ORDER } from "./fabricLuminous";
import { LuminousBacklightArc } from "./fabricLuminousBacklight";
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
    const materialSide = fabric.isBlockout
        ? DoubleSide
        : inward
            ? BackSide
            : FrontSide;

    return (
        <>
            {isLuminous && (
                <LuminousBacklightArc
                    radius={radius}
                    height={height}
                    thetaStart={thetaStart}
                    thetaLength={thetaLength}
                />
            )}
            {fabric.isBlockout && (
                <BlockoutBackingArc
                    radius={radius}
                    height={height}
                    thetaStart={thetaStart}
                    thetaLength={thetaLength}
                    radialSegments={radialSegments}
                />
            )}
            <mesh
                renderOrder={isLuminous ? LUMINOUS_FABRIC_RENDER_ORDER : 1}
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
        </>
    );
}
