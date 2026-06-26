import type { StandModule } from "../models/ModuleModel";
import { getRailThickness } from "../utils/fabrics";
import { getExhibitionWallDividerPositions } from "../utils/exhibitionWallGeometry";
import { FrameMaterial } from "./FrameMaterial";
import { WallFrame } from "./WallFrame";
import { ignoreRaycast } from "./raycast";

interface ExhibitionWallFrameProps {
    module: StandModule;
    color: string;
}

export function ExhibitionWallFrame({
    module,
    color
}: ExhibitionWallFrameProps) {
    const rail = getRailThickness(module);
    const dividers = getExhibitionWallDividerPositions(module);

    return (
        <>
            <WallFrame
                module={module}
                color={color}
            />

            {dividers.map((x, index) => (
                <mesh
                    key={index}
                    position={[x, 0, 0]}
                    raycast={ignoreRaycast}
                >
                    <boxGeometry args={[rail, module.height, module.depth]} />
                    <FrameMaterial color={color} />
                </mesh>
            ))}
        </>
    );
}
