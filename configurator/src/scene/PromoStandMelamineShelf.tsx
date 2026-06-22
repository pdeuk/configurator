import type { StandModule } from "../models/ModuleModel";
import {
    getRailThickness,
    MELAMINE_SHELF_THICKNESS
} from "../utils/fabrics";
import { ignoreRaycast } from "./raycast";

const MELAMINE_COLOR = "#ddd5c8";

interface PromoStandMelamineShelfProps {
    module: StandModule;
}

export function PromoStandMelamineShelf({ module }: PromoStandMelamineShelfProps) {
    const rail = getRailThickness(module);
    const innerWidth = Math.max(module.width - rail * 2, rail);
    const innerDepth = Math.max(module.depth - rail * 2, rail);

    return (
        <mesh
            position={[0, 0, 0]}
            raycast={ignoreRaycast}
        >
            <boxGeometry
                args={[innerWidth, MELAMINE_SHELF_THICKNESS, innerDepth]}
            />
            <meshStandardMaterial
                color={MELAMINE_COLOR}
                roughness={0.35}
                metalness={0.02}
            />
        </mesh>
    );
}
