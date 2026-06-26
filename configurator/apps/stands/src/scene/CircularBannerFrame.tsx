import type { StandModule } from "../models/ModuleModel";
import { getRailThickness } from "../utils/fabrics";
import {
    getBannerMidRadius,
    getBannerRadialDividerAngles,
    getBannerRingThickness
} from "../utils/bannerGeometry";
import { FrameMaterial } from "./FrameMaterial";
import { ignoreRaycast } from "./raycast";

interface CircularBannerFrameProps {
    module: StandModule;
    color: string;
}

export function CircularBannerFrame({
    module,
    color
}: CircularBannerFrameProps) {
    const rail = getRailThickness(module);
    const midRadius = getBannerMidRadius(module);
    const ringThickness = getBannerRingThickness(module);
    const dividerAngles = getBannerRadialDividerAngles(module);
    const halfHeight = module.height / 2;

    return (
        <>
            <mesh
                position={[0, halfHeight - rail / 2, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                raycast={ignoreRaycast}
            >
                <torusGeometry args={[midRadius, rail / 2, 12, 64]} />
                <FrameMaterial color={color} />
            </mesh>

            <mesh
                position={[0, -halfHeight + rail / 2, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                raycast={ignoreRaycast}
            >
                <torusGeometry args={[midRadius, rail / 2, 12, 64]} />
                <FrameMaterial color={color} />
            </mesh>

            {dividerAngles.map((angle, index) => (
                <mesh
                    key={index}
                    position={[
                        midRadius * Math.sin(angle),
                        0,
                        -midRadius * Math.cos(angle)
                    ]}
                    rotation={[0, angle, 0]}
                    raycast={ignoreRaycast}
                >
                    <boxGeometry args={[rail, module.height, ringThickness]} />
                    <FrameMaterial color={color} />
                </mesh>
            ))}
        </>
    );
}
