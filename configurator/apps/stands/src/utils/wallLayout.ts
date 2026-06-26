import type { Position3, StandModule, WallLayout } from "../models/ModuleModel";
import { DEFAULT_WALL_ROTATION } from "./componentCatalog";
import { createDefaultFabrics, createDefaultBoothDoorWallFabrics } from "./fabrics";

export const FRAME_WALL_WIDTH = 1;
export const FRAME_WALL_HEIGHT = 2;
export const FRAME_WALL_DEPTH = 0.05;
export const FRAME_SQUARE_DEEP_WALL_DEPTH = 0.15;
export const BOOTH_DOOR_TOP_SECTION_RATIO = 0.25;
export const FRAME_SQUARE_ROTATION_STEP = Math.PI / 2;
// Rotation step that would point the door back into the anchor wall.
export const INVALID_FRAME_SQUARE_ROTATION_STEP = 3;

export type ExhibitionWallAttachSide = "left" | "right";

export interface FrameSquareWallSpec {
    localX: number;
    localZ: number;
    localRotation: number;
    wallLayout: WallLayout;
    depth: number;
    width: number;
}

interface SquareLocalWallSpec {
    squareX: number;
    squareZ: number;
    localRotation: number;
    wallLayout: WallLayout;
    depth: number;
    width: number;
}

function getAttachDirection(side: ExhibitionWallAttachSide) {
    return side === "right" ? 1 : -1;
}

function rotateAroundPivot(
    localX: number,
    localZ: number,
    pivotX: number,
    pivotZ: number,
    angle: number
) {
    const dx = localX - pivotX;
    const dz = localZ - pivotZ;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    return {
        localX: pivotX + dx * cos - dz * sin,
        localZ: pivotZ + dx * sin + dz * cos
    };
}

function getSquareBaseSpecs(): SquareLocalWallSpec[] {
    const half = FRAME_WALL_WIDTH / 2;
    const nearDepth = FRAME_WALL_DEPTH;
    const farDepth = FRAME_SQUARE_DEEP_WALL_DEPTH;
    // The door wall ends where the perpendicular side faces begin: it spans
    // only between the inner faces of the near and far side walls instead of
    // overlapping into them.
    const nearInnerX = -half + nearDepth / 2;
    const farInnerX = half - farDepth / 2;
    const doorWidth = farInnerX - nearInnerX;
    const doorCenterX = (nearInnerX + farInnerX) / 2;

    return [
        {
            squareX: -half,
            squareZ: 0,
            localRotation: Math.PI / 2,
            wallLayout: "standard",
            depth: nearDepth,
            width: FRAME_WALL_WIDTH
        },
        // Back wall, parallel to the anchor and flush with its back face.
        // Rotated 180° so its front/back faces are not inverted.
        {
            squareX: 0,
            squareZ: half,
            localRotation: DEFAULT_WALL_ROTATION + Math.PI,
            wallLayout: "standard",
            depth: farDepth,
            width: FRAME_WALL_WIDTH
        },
        // Door wall, parallel to the anchor at the front opening, facing the
        // same way as the anchor's front by default. Trimmed to fit between
        // the side walls so it ends where the side faces begin.
        {
            squareX: doorCenterX,
            squareZ: -half,
            localRotation: 0,
            wallLayout: "boothDoor",
            depth: nearDepth,
            width: doorWidth
        },
        // Far side wall, opposite the attached side. Rotated 180° so its
        // front/back faces are not inverted.
        {
            squareX: half,
            squareZ: 0,
            localRotation: Math.PI / 2 + Math.PI,
            wallLayout: "standard",
            depth: farDepth,
            width: FRAME_WALL_WIDTH
        }
    ];
}

export function isFrameSquareRotationValid(rotationSteps: number) {
    return rotationSteps % 4 !== INVALID_FRAME_SQUARE_ROTATION_STEP;
}

export function getNextFrameSquareRotationSteps(current: number) {
    let next = (current + 1) % 4;

    if (!isFrameSquareRotationValid(next)) {
        next = (next + 1) % 4;
    }

    return next;
}

export function getFrameSquareWallSpecs(
    anchor: StandModule,
    side: ExhibitionWallAttachSide,
    rotationSteps = 0
): FrameSquareWallSpec[] {
    const dir = getAttachDirection(side);
    const half = FRAME_WALL_WIDTH / 2;
    const edgeX = dir * (anchor.width / 2);
    const squareCenterX = edgeX + dir * half;
    const rotationAngle = rotationSteps * FRAME_SQUARE_ROTATION_STEP;
    const anchorBackZ = (anchor.depth ?? FRAME_SQUARE_DEEP_WALL_DEPTH) / 2;
    // Move the whole square so the back wall's outer face is flush with the
    // anchor wall's back face, extending toward the front.
    const squareCenterZ = anchorBackZ - half - FRAME_SQUARE_DEEP_WALL_DEPTH / 2;

    return getSquareBaseSpecs().map(spec => {
        const rotated = rotateAroundPivot(
            spec.squareX,
            spec.squareZ,
            0,
            0,
            rotationAngle
        );

        return {
            localX: squareCenterX + dir * rotated.localX,
            localZ: squareCenterZ + rotated.localZ,
            localRotation: spec.localRotation + rotationAngle,
            wallLayout: spec.wallLayout,
            depth: spec.depth,
            width: spec.width
        };
    });
}

function anchorLocalToWorld(
    anchor: StandModule,
    localX: number,
    localZ: number
): Position3 {
    // Match three.js's Y-axis rotation convention so the square stays rigidly
    // attached when the anchor wall is rotated (not just at the default angle).
    const cos = Math.cos(anchor.rotation);
    const sin = Math.sin(anchor.rotation);

    return {
        x: anchor.position.x + localX * cos + localZ * sin,
        y: anchor.position.y,
        z: anchor.position.z - localX * sin + localZ * cos
    };
}

function anchorLocalRotationToWorld(
    anchor: StandModule,
    localRotation: number
): number {
    return anchor.rotation + localRotation;
}

function createWallFromSpec(
    anchor: StandModule,
    spec: FrameSquareWallSpec
): StandModule {
    const position = anchorLocalToWorld(anchor, spec.localX, spec.localZ);
    const isDoor = spec.wallLayout === "boothDoor";

    return {
        id: `wall-${crypto.randomUUID()}`,
        type: "wall",
        position,
        rotation: anchorLocalRotationToWorld(anchor, spec.localRotation),
        width: spec.width,
        height: FRAME_WALL_HEIGHT,
        depth: spec.depth,
        wallLayout: spec.wallLayout,
        snappedTo: anchor.id,
        fabrics: isDoor
            ? createDefaultBoothDoorWallFabrics()
            : createDefaultFabrics("wall")
    };
}

export function createFrameSquareFromExhibitionWall(
    anchor: StandModule,
    side: ExhibitionWallAttachSide,
    rotationSteps = 0
): StandModule[] {
    return getFrameSquareWallSpecs(anchor, side, rotationSteps).map(spec =>
        createWallFromSpec(anchor, spec)
    );
}

export function getBoothDoorSplitY(module: Pick<StandModule, "height">) {
    const halfHeight = module.height / 2;

    return halfHeight - module.height * BOOTH_DOOR_TOP_SECTION_RATIO;
}

export function getBoothDoorTopPanelHeight(module: Pick<StandModule, "height">) {
    return module.height * BOOTH_DOOR_TOP_SECTION_RATIO;
}

export function getBoothDoorDoorHeight(module: Pick<StandModule, "height">) {
    return module.height * (1 - BOOTH_DOOR_TOP_SECTION_RATIO);
}

export function getBoothDoorTopPanelWidth(module: Pick<StandModule, "width">) {
    return module.width / 2;
}
