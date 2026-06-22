import type { StandModule } from "../models/ModuleModel";
import { getRailThickness } from "../utils/fabrics";
import {
    getSquareBannerDividerPositions,
    getSquareBannerMidHalf,
    getSquareMidSpan,
    getBannerRingThickness,
    isSquareBannerCornerDivider
} from "../utils/bannerGeometry";
import { ignoreRaycast } from "./raycast";

interface SquareBannerFrameProps {
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

export function SquareBannerFrame({
    module,
    color
}: SquareBannerFrameProps) {
    const rail = getRailThickness(module);
    const midHalf = getSquareBannerMidHalf(module);
    const midSpan = getSquareMidSpan(module);
    const ringThickness = getBannerRingThickness(module);
    const dividers = getSquareBannerDividerPositions(module);
    const halfHeight = module.height / 2;
    const topY = halfHeight - rail / 2;
    const bottomY = -halfHeight + rail / 2;
    const corners: Array<[number, number]> = [
        [-midHalf, -midHalf],
        [midHalf, -midHalf],
        [midHalf, midHalf],
        [-midHalf, midHalf]
    ];
    const edges: Array<{
        size: [number, number, number];
        topPos: [number, number, number];
        bottomPos: [number, number, number];
    }> = [
        {
            size: [midSpan, rail, rail],
            topPos: [0, topY, -midHalf],
            bottomPos: [0, bottomY, -midHalf]
        },
        {
            size: [rail, rail, midSpan],
            topPos: [midHalf, topY, 0],
            bottomPos: [midHalf, bottomY, 0]
        },
        {
            size: [midSpan, rail, rail],
            topPos: [0, topY, midHalf],
            bottomPos: [0, bottomY, midHalf]
        },
        {
            size: [rail, rail, midSpan],
            topPos: [-midHalf, topY, 0],
            bottomPos: [-midHalf, bottomY, 0]
        }
    ];

    return (
        <>
            {corners.map(([x, z], index) => (
                <Rail
                    key={`corner-${index}`}
                    size={[rail, module.height, rail]}
                    position={[x, 0, z]}
                    color={color}
                />
            ))}

            {edges.map((edge, index) => (
                <group key={index}>
                    <Rail
                        size={edge.size}
                        position={edge.topPos}
                        color={color}
                    />
                    <Rail
                        size={edge.size}
                        position={edge.bottomPos}
                        color={color}
                    />
                </group>
            ))}

            {dividers.map((divider, index) => {
                if (isSquareBannerCornerDivider(index, module)) {
                    return null;
                }

                return (
                    <mesh
                        key={index}
                        position={[divider.x, 0, divider.z]}
                        rotation={[0, divider.rotationY, 0]}
                        raycast={ignoreRaycast}
                    >
                        <boxGeometry args={[rail, module.height, ringThickness]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                );
            })}
        </>
    );
}
