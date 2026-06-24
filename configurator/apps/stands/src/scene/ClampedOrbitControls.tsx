import { OrbitControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

/** Keep the camera at or above the floor plane (Y = 0). */
export const ORBIT_MAX_POLAR_ANGLE = Math.PI / 2 - 0.08;

const MIN_CAMERA_HEIGHT = 0.25;
const MIN_TARGET_HEIGHT = 0;

interface ClampedOrbitControlsProps {
    enabled: boolean;
}

function clampOrbitAboveFloor(
    controls: OrbitControlsImpl,
    minCameraHeight: number,
    minTargetHeight: number
) {
    const camera = controls.object;
    const { target } = controls;
    let adjusted = false;

    if (target.y < minTargetHeight) {
        const delta = minTargetHeight - target.y;

        target.y = minTargetHeight;
        camera.position.y += delta;
        adjusted = true;
    }

    if (camera.position.y < minCameraHeight) {
        const delta = minCameraHeight - camera.position.y;

        camera.position.y = minCameraHeight;
        target.y += delta;
        adjusted = true;
    }

    if (adjusted) {
        controls.update();
    }
}

export function ClampedOrbitControls({ enabled }: ClampedOrbitControlsProps) {
    const controlsRef = useRef<OrbitControlsImpl>(null);

    useFrame(() => {
        if (!enabled) {
            return;
        }

        const controls = controlsRef.current;

        if (!controls) {
            return;
        }

        clampOrbitAboveFloor(controls, MIN_CAMERA_HEIGHT, MIN_TARGET_HEIGHT);
    });

    return (
        <OrbitControls
            ref={controlsRef}
            makeDefault
            enabled={enabled}
            maxPolarAngle={ORBIT_MAX_POLAR_ANGLE}
            onChange={() => {
                const controls = controlsRef.current;

                if (!controls) {
                    return;
                }

                clampOrbitAboveFloor(controls, MIN_CAMERA_HEIGHT, MIN_TARGET_HEIGHT);
            }}
        />
    );
}
