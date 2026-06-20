import type { StandModule } from "../models/ModuleModel";
import { getRailThickness } from "../utils/fabrics";
import { ignoreRaycast } from "./raycast";

interface CubeFrameProps {
    module: StandModule;
    color: string;
}

interface RailProps {
    size: [number, number, number];
    position: [number, number, number];
    color: string;
}

function Rail({ size, position, color }: RailProps) {
    return (
        <mesh position={position} raycast={ignoreRaycast}>
            <boxGeometry args={size} />
            <meshStandardMaterial color={color} />
        </mesh>
    );
}

export function CubeFrame({ module, color }: CubeFrameProps) {
    const rail = getRailThickness(module);
    const halfWidth = module.width / 2;
    const halfHeight = module.height / 2;
    const halfDepth = module.depth / 2;
    const innerDepth = Math.max(module.depth - rail * 2, rail);
    const innerWidth = Math.max(module.width - rail * 2, rail);

    const frontZ = -halfDepth + rail / 2;
    const backZ = halfDepth - rail / 2;
    const leftX = -halfWidth + rail / 2;
    const rightX = halfWidth - rail / 2;
    const topY = halfHeight - rail / 2;
    const bottomY = -halfHeight + rail / 2;

    const cornerPositions: Array<[number, number, number]> = [
        [leftX, 0, frontZ],
        [rightX, 0, frontZ],
        [leftX, 0, backZ],
        [rightX, 0, backZ]
    ];

    return (
        <>
            {cornerPositions.map((position, index) => (
                <Rail
                    key={`corner-${index}`}
                    size={[rail, module.height, rail]}
                    position={position}
                    color={color}
                />
            ))}

            <Rail
                size={[innerWidth, rail, rail]}
                position={[0, topY, frontZ]}
                color={color}
            />
            <Rail
                size={[innerWidth, rail, rail]}
                position={[0, bottomY, frontZ]}
                color={color}
            />

            <Rail
                size={[innerWidth, rail, rail]}
                position={[0, topY, backZ]}
                color={color}
            />
            <Rail
                size={[innerWidth, rail, rail]}
                position={[0, bottomY, backZ]}
                color={color}
            />

            <Rail
                size={[rail, rail, innerDepth]}
                position={[leftX, topY, 0]}
                color={color}
            />
            <Rail
                size={[rail, rail, innerDepth]}
                position={[leftX, bottomY, 0]}
                color={color}
            />

            <Rail
                size={[rail, rail, innerDepth]}
                position={[rightX, topY, 0]}
                color={color}
            />
            <Rail
                size={[rail, rail, innerDepth]}
                position={[rightX, bottomY, 0]}
                color={color}
            />
        </>
    );
}
