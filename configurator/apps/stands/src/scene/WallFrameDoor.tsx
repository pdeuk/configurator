import type { StandModule } from "../models/ModuleModel";
import {
    getBoothDoorDoorHeight,
    getBoothDoorSplitY
} from "../utils/wallLayout";
import { BOOTH_DOOR_FRAME_THICKNESS } from "./BoothDoorWallFrame";
import { ignoreRaycast } from "./raycast";

const DOOR_OPEN_ANGLE = Math.PI / 8;
const DOOR_THICKNESS = 0.01;
const DOOR_COLOR = "#e8e4dc";

interface WallFrameDoorProps {
    module: StandModule;
}

export function WallFrameDoor({ module }: WallFrameDoorProps) {
    const rail = Math.min(
        BOOTH_DOOR_FRAME_THICKNESS,
        module.width / 2,
        module.height / 2
    );
    const halfWidth = module.width / 2;
    const splitY = getBoothDoorSplitY(module);
    const doorHeight = getBoothDoorDoorHeight(module) - rail * 2;
    const doorWidth = Math.max(module.width - rail * 2, rail);
    const doorCenterY = (-module.height / 2 + splitY) / 2;
    const hingeX = -halfWidth + rail;
    const doorZ = module.depth / 2 + DOOR_THICKNESS / 2;

    return (
        <group position={[hingeX, doorCenterY, doorZ]} rotation={[0, -DOOR_OPEN_ANGLE, 0]}>
            <mesh position={[doorWidth / 2, 0, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[doorWidth, doorHeight, DOOR_THICKNESS]} />
                <meshStandardMaterial
                    color={DOOR_COLOR}
                    roughness={0.45}
                    metalness={0.04}
                />
            </mesh>
        </group>
    );
}
