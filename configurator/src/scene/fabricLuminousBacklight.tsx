import { ignoreRaycast } from "./raycast";
import { getInteriorLocalZOffset } from "./fabricInteriorOffset";
import {
    getFabricBloomGlowMaterialProps,
    getFabricCoreGlowMaterialProps,
    GLOW_BLOOM_SCALE,
    GLOW_COLOR,
    LUMINOUS_BACK_GLOW_RENDER_ORDER,
    LUMINOUS_BLOOM_GLOW_RENDER_ORDER,
    LUMINOUS_BLOOM_OFFSET,
    LUMINOUS_GLOW_OFFSET,
    LUMINOUS_RECT_LIGHT_INTENSITY
} from "./fabricLuminous";

interface LuminousBacklightPlaneProps {
    panelWidth: number;
    panelHeight: number;
    rotation: [number, number, number];
}

export function LuminousBacklightPlane({
    panelWidth,
    panelHeight,
    rotation
}: LuminousBacklightPlaneProps) {
    const coreGlow = getFabricCoreGlowMaterialProps();
    const bloomGlow = getFabricBloomGlowMaterialProps();
    const coreZ = getInteriorLocalZOffset(rotation, LUMINOUS_GLOW_OFFSET);
    const bloomZ = getInteriorLocalZOffset(rotation, LUMINOUS_BLOOM_OFFSET);
    const lightZ = getInteriorLocalZOffset(rotation, 0.022);

    return (
        <>
            <rectAreaLight
                width={panelWidth * 0.92}
                height={panelHeight * 0.92}
                intensity={LUMINOUS_RECT_LIGHT_INTENSITY}
                color={GLOW_COLOR}
                position={[0, 0, lightZ]}
                rotation={[0, Math.PI, 0]}
            />
            <mesh
                position={[0, 0, bloomZ]}
                scale={[GLOW_BLOOM_SCALE, GLOW_BLOOM_SCALE, 1]}
                renderOrder={LUMINOUS_BLOOM_GLOW_RENDER_ORDER}
                raycast={ignoreRaycast}
            >
                <planeGeometry args={[panelWidth * 1.02, panelHeight * 1.02]} />
                <meshBasicMaterial {...bloomGlow} />
            </mesh>
            <mesh
                position={[0, 0, coreZ]}
                renderOrder={LUMINOUS_BACK_GLOW_RENDER_ORDER}
                raycast={ignoreRaycast}
            >
                <planeGeometry args={[panelWidth, panelHeight]} />
                <meshBasicMaterial {...coreGlow} />
            </mesh>
        </>
    );
}

interface LuminousBacklightArcProps {
    radius: number;
    height: number;
    thetaStart: number;
    thetaLength: number;
    radialSegments: number;
    inward?: boolean;
}

export function LuminousBacklightArc({
    radius,
    height,
    thetaStart,
    thetaLength,
    radialSegments,
    inward = false
}: LuminousBacklightArcProps) {
    const coreGlow = getFabricCoreGlowMaterialProps();
    const bloomGlow = getFabricBloomGlowMaterialProps();
    const coreRadius = inward
        ? radius - LUMINOUS_GLOW_OFFSET
        : radius + LUMINOUS_GLOW_OFFSET;
    const bloomRadius = inward
        ? radius - LUMINOUS_BLOOM_OFFSET
        : radius + LUMINOUS_BLOOM_OFFSET;

    const createArcGeometry = (arcRadius: number) => (
        <cylinderGeometry
            args={[
                arcRadius,
                arcRadius,
                height,
                radialSegments,
                1,
                true,
                thetaStart,
                thetaLength
            ]}
        />
    );

    return (
        <>
            <mesh
                renderOrder={LUMINOUS_BLOOM_GLOW_RENDER_ORDER}
                raycast={ignoreRaycast}
            >
                {createArcGeometry(bloomRadius * GLOW_BLOOM_SCALE)}
                <meshBasicMaterial {...bloomGlow} />
            </mesh>
            <mesh
                renderOrder={LUMINOUS_BACK_GLOW_RENDER_ORDER}
                raycast={ignoreRaycast}
            >
                {createArcGeometry(coreRadius)}
                <meshBasicMaterial {...coreGlow} />
            </mesh>
        </>
    );
}
