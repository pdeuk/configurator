import type { StandModule } from "../models/ModuleModel";
import { getRailThickness } from "../utils/fabrics";
import { ignoreRaycast } from "./raycast";

const DOOR_OPEN_ANGLE = Math.PI / 6;
const DOOR_THICKNESS = 0.008;
const DOOR_COLOR = "#e8e4dc";

interface PromoStandBackDoorsProps {
    module: StandModule;
}

interface DoorPanelProps {
    hingeX: number;
    doorWidth: number;
    doorHeight: number;
    openAngle: number;
    panelOffsetX: number;
}

function DoorPanel({
    hingeX,
    doorWidth,
    doorHeight,
    openAngle,
    panelOffsetX
}: DoorPanelProps) {
    const halfDepth = 0;

    return (
        <group position={[hingeX, 0, halfDepth]} rotation={[0, openAngle, 0]}>
            <mesh position={[panelOffsetX, 0, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[doorWidth, doorHeight, DOOR_THICKNESS]} />
                <meshStandardMaterial
                    color={DOOR_COLOR}
                    roughness={0.4}
                    metalness={0.02}
                />
            </mesh>
        </group>
    );
}

export function PromoStandBackDoors({ module }: PromoStandBackDoorsProps) {
    const rail = getRailThickness(module);
    const halfWidth = module.width / 2;
    const halfDepth = module.depth / 2;
    const innerWidth = Math.max(module.width - rail * 2, rail);
    const innerHeight = Math.max(module.height - rail * 2, rail);
    const doorWidth = innerWidth / 2;
    const doorZ = halfDepth + DOOR_THICKNESS / 2;

    return (
        <group position={[0, 0, doorZ]}>
            <DoorPanel
                hingeX={-halfWidth + rail}
                doorWidth={doorWidth}
                doorHeight={innerHeight}
                openAngle={-DOOR_OPEN_ANGLE}
                panelOffsetX={doorWidth / 2}
            />
            <DoorPanel
                hingeX={halfWidth - rail}
                doorWidth={doorWidth}
                doorHeight={innerHeight}
                openAngle={DOOR_OPEN_ANGLE}
                panelOffsetX={-doorWidth / 2}
            />
        </group>
    );
}
