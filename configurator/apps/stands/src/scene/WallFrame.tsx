import type { StandModule } from "../models/ModuleModel";
import { ignoreRaycast } from "./raycast";

const DEFAULT_FRAME_THICKNESS = 0.14;

export interface HiddenFrameSides {
    left?: boolean;
    right?: boolean;
}

interface WallFrameProps {
    module: StandModule;
    color: string;
    opacity?: number;
    wireframe?: boolean;
    hiddenSides?: HiddenFrameSides;
}

export function WallFrame({
    module,
    color,
    opacity = 1,
    wireframe = false,
    hiddenSides
}: WallFrameProps) {
    const railThickness = Math.min(
        DEFAULT_FRAME_THICKNESS,
        module.width / 2,
        module.height / 2
    );
    const materialProps = {
        color,
        transparent: opacity < 1,
        opacity,
        wireframe
    };

    return (
        <>
            <mesh position={[0, module.height / 2 - railThickness / 2, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[module.width, railThickness, module.depth]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            <mesh position={[0, -module.height / 2 + railThickness / 2, 0]} raycast={ignoreRaycast}>
                <boxGeometry args={[module.width, railThickness, module.depth]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {!hiddenSides?.left && (
                <mesh position={[-module.width / 2 + railThickness / 2, 0, 0]} raycast={ignoreRaycast}>
                    <boxGeometry args={[railThickness, module.height, module.depth]} />
                    <meshStandardMaterial {...materialProps} />
                </mesh>
            )}

            {!hiddenSides?.right && (
                <mesh position={[module.width / 2 - railThickness / 2, 0, 0]} raycast={ignoreRaycast}>
                    <boxGeometry args={[railThickness, module.height, module.depth]} />
                    <meshStandardMaterial {...materialProps} />
                </mesh>
            )}
        </>
    );
}
