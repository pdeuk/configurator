import type { ThreeEvent } from "@react-three/fiber";
import type { StandModule } from "../models/ModuleModel";
import {
    MELAMINE_TOP_EXCESS,
    MELAMINE_TOP_THICKNESS
} from "../utils/fabrics";
import { ignoreRaycast } from "./raycast";

const MELAMINE_COLOR = "#ddd5c8";

interface PromoStandMelamineTopProps {
    module: StandModule;
}

function stopFabricPointerPropagation(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
}

export function PromoStandMelamineTop({ module }: PromoStandMelamineTopProps) {
    const halfHeight = module.height / 2;

    return (
        <mesh
            position={[0, halfHeight + MELAMINE_TOP_THICKNESS / 2, 0]}
            onPointerDown={stopFabricPointerPropagation}
            raycast={ignoreRaycast}
        >
            <boxGeometry
                args={[
                    module.width + MELAMINE_TOP_EXCESS * 2,
                    MELAMINE_TOP_THICKNESS,
                    module.depth + MELAMINE_TOP_EXCESS * 2
                ]}
            />
            <meshStandardMaterial
                color={MELAMINE_COLOR}
                roughness={0.35}
                metalness={0.02}
            />
        </mesh>
    );
}
