import type { StandModule } from "../models/ModuleModel";
import { getBoothDoorSplitY } from "../utils/wallLayout";
import { FrameMaterial } from "./FrameMaterial";
import { ignoreRaycast } from "./raycast";

export const BOOTH_DOOR_FRAME_THICKNESS = 0.06;

interface BoothDoorWallFrameProps {
    module: StandModule;
    color: string;
    wireframe?: boolean;
}

export function BoothDoorWallFrame({
    module,
    color,
    wireframe = false
}: BoothDoorWallFrameProps) {
    const rail = Math.min(
        BOOTH_DOOR_FRAME_THICKNESS,
        module.width / 2,
        module.height / 2
    );
    const halfWidth = module.width / 2;
    const halfHeight = module.height / 2;
    const splitY = getBoothDoorSplitY(module);
    const materialProps = { color, wireframe };

    return (
        <>
            <mesh position={[0, halfHeight - rail / 2, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[module.width, rail, module.depth]} />
                <FrameMaterial {...materialProps} />
            </mesh>

            <mesh position={[0, -halfHeight + rail / 2, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[module.width, rail, module.depth]} />
                <FrameMaterial {...materialProps} />
            </mesh>

            <mesh position={[0, splitY, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[module.width, rail, module.depth]} />
                <FrameMaterial {...materialProps} />
            </mesh>

            <mesh position={[-halfWidth + rail / 2, 0, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[rail, module.height, module.depth]} />
                <FrameMaterial {...materialProps} />
            </mesh>

            <mesh position={[halfWidth - rail / 2, 0, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[rail, module.height, module.depth]} />
                <FrameMaterial {...materialProps} />
            </mesh>
        </>
    );
}
