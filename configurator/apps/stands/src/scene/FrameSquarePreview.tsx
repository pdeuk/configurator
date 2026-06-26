import { useEditorStore } from "../store/editorStore";
import type { StandModule } from "../models/ModuleModel";
import {
    FRAME_WALL_HEIGHT,
    getFrameSquareWallSpecs
} from "../utils/wallLayout";
import { BoothDoorWallFrame } from "./BoothDoorWallFrame";
import { WallFrame } from "./WallFrame";

const PREVIEW_WALL_COLOR = "#1f8cff";
const PREVIEW_DOOR_WALL_COLOR = "#a855f7";

interface FrameSquarePreviewProps {
    anchor: StandModule;
    attachSide: "left" | "right";
    rotationSteps: number;
}

function PreviewWall({
    module,
    color
}: {
    module: StandModule;
    color: string;
}) {
    const isDoor = module.wallLayout === "boothDoor";

    return (
        <group
            position={[
                module.position.x,
                module.position.y + module.height / 2,
                module.position.z
            ]}
            rotation={[0, module.rotation, 0]}
        >
            {isDoor ? (
                <BoothDoorWallFrame
                    module={module}
                    color={color}
                    wireframe
                />
            ) : (
                <WallFrame
                    module={module}
                    color={color}
                    wireframe
                />
            )}
        </group>
    );
}

export function FrameSquarePreview({
    anchor,
    attachSide,
    rotationSteps
}: FrameSquarePreviewProps) {
    const specs = getFrameSquareWallSpecs(anchor, attachSide, rotationSteps);

    return (
        <>
            {specs.map((spec, index) => {
                const cos = Math.cos(anchor.rotation);
                const sin = Math.sin(anchor.rotation);
                const worldX = anchor.position.x + spec.localX * cos + spec.localZ * sin;
                const worldZ = anchor.position.z - spec.localX * sin + spec.localZ * cos;

                const previewModule: StandModule = {
                    id: `preview-${index}`,
                    type: "wall",
                    position: { x: worldX, y: anchor.position.y, z: worldZ },
                    rotation: anchor.rotation + spec.localRotation,
                    width: spec.width,
                    height: FRAME_WALL_HEIGHT,
                    depth: spec.depth,
                    wallLayout: spec.wallLayout
                };

                return (
                    <PreviewWall
                        key={index}
                        module={previewModule}
                        color={spec.wallLayout === "boothDoor"
                            ? PREVIEW_DOOR_WALL_COLOR
                            : PREVIEW_WALL_COLOR}
                    />
                );
            })}
        </>
    );
}

export function FrameSquarePreviewBridge() {
    const placement = useEditorStore(state => state.frameSquarePlacement);
    const anchor = useEditorStore(state =>
        placement
            ? state.modulesById[placement.anchorModuleId]
            : undefined
    );

    if (!placement || !anchor) {
        return null;
    }

    return (
        <FrameSquarePreview
            anchor={anchor}
            attachSide={placement.attachSide}
            rotationSteps={placement.rotationSteps}
        />
    );
}
