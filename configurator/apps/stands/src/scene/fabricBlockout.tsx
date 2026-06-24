import { BackSide, FrontSide } from "three";
import {
    BLOCKOUT_BACKING_COLOR,
    BLOCKOUT_BACKING_OFFSET,
    BLOCKOUT_BACKING_RENDER_ORDER
} from "./fabricLuminous";
import { ignoreRaycast } from "./raycast";

interface BlockoutBackingPlaneProps {
    panelWidth: number;
    panelHeight: number;
    doubleSided?: boolean;
}

export function BlockoutBackingPlane({
    panelWidth,
    panelHeight,
    doubleSided = false
}: BlockoutBackingPlaneProps) {
    if (doubleSided) {
        return (
            <>
                <mesh
                    position={[0, 0, -BLOCKOUT_BACKING_OFFSET]}
                    renderOrder={BLOCKOUT_BACKING_RENDER_ORDER}
                    raycast={ignoreRaycast}
                >
                    <planeGeometry args={[panelWidth, panelHeight]} />
                    <meshBasicMaterial
                        color={BLOCKOUT_BACKING_COLOR}
                        side={FrontSide}
                        toneMapped={false}
                    />
                </mesh>
                <mesh
                    position={[0, 0, BLOCKOUT_BACKING_OFFSET]}
                    renderOrder={BLOCKOUT_BACKING_RENDER_ORDER}
                    raycast={ignoreRaycast}
                >
                    <planeGeometry args={[panelWidth, panelHeight]} />
                    <meshBasicMaterial
                        color={BLOCKOUT_BACKING_COLOR}
                        side={BackSide}
                        toneMapped={false}
                    />
                </mesh>
            </>
        );
    }

    return (
        <mesh
            position={[0, 0, -BLOCKOUT_BACKING_OFFSET]}
            renderOrder={BLOCKOUT_BACKING_RENDER_ORDER}
            raycast={ignoreRaycast}
        >
            <planeGeometry args={[panelWidth, panelHeight]} />
            <meshBasicMaterial
                color={BLOCKOUT_BACKING_COLOR}
                side={FrontSide}
                toneMapped={false}
            />
        </mesh>
    );
}

interface BlockoutBackingArcProps {
    radius: number;
    height: number;
    thetaStart: number;
    thetaLength: number;
    radialSegments: number;
}

export function BlockoutBackingArc({
    radius,
    height,
    thetaStart,
    thetaLength,
    radialSegments
}: BlockoutBackingArcProps) {
    const backingRadius = radius - BLOCKOUT_BACKING_OFFSET;

    return (
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
                side={BackSide}
                toneMapped={false}
            />
        </mesh>
    );
}
