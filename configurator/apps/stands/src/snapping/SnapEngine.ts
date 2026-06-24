import type { StandModule } from "../models/ModuleModel";
import { overlapLength } from "./SnapMath";
import type { SnapAxis, SnapFace, SnapResult } from "./SnapTypes";

const SNAP_DISTANCE = 0.3;
const MIN_FACE_OVERLAP = 0.01;

interface Bounds {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    halfX: number;
    halfZ: number;
}

interface FaceCandidate {
    axis: SnapAxis;
    movingFace: SnapFace;
    targetFace: SnapFace;
    distance: number;
    overlap: number;
    position: StandModule["position"];
}

export function findSnap(
    moving: StandModule,
    modules: StandModule[]
): SnapResult | null {
    const candidates: SnapResult[] = [];

    for (const target of modules) {
        if (target.id === moving.id) {
            continue;
        }

        candidates.push(
            ...collectFaceSnapCandidates(
                moving,
                target
            )
        );
    }

    if (candidates.length === 0) {
        return null;
    }

    candidates.sort((a, b) => a.distance - b.distance);

    return candidates[0] ?? null;
}

function collectFaceSnapCandidates(
    moving: StandModule,
    target: StandModule
): SnapResult[] {
    return getFaceCandidates(moving, target)
        .filter(candidate =>
            candidate.distance <= SNAP_DISTANCE &&
            candidate.overlap >= MIN_FACE_OVERLAP
        )
        .map(candidate => ({
            position: candidate.position,
            axis: candidate.axis,
            distance: candidate.distance,
            moving,
            target,
            movingFace: candidate.movingFace,
            targetFace: candidate.targetFace,
            overlap: candidate.overlap,
            anchor: {
                movingFace: candidate.movingFace,
                targetFace: candidate.targetFace,
                axis: candidate.axis
            }
        }));
}

function getFaceCandidates(
    moving: StandModule,
    target: StandModule
): FaceCandidate[] {
    const movingBounds = getBounds(moving);
    const targetBounds = getBounds(target);

    const zOverlap = overlapLength(
        movingBounds.minZ,
        movingBounds.maxZ,
        targetBounds.minZ,
        targetBounds.maxZ
    );

    const xOverlap = overlapLength(
        movingBounds.minX,
        movingBounds.maxX,
        targetBounds.minX,
        targetBounds.maxX
    );

    return [
        {
            axis: "x",
            movingFace: "right",
            targetFace: "left",
            distance: Math.abs(movingBounds.maxX - targetBounds.minX),
            overlap: zOverlap,
            position: {
                ...moving.position,
                x: targetBounds.minX - movingBounds.halfX
            }
        },
        {
            axis: "x",
            movingFace: "left",
            targetFace: "right",
            distance: Math.abs(movingBounds.minX - targetBounds.maxX),
            overlap: zOverlap,
            position: {
                ...moving.position,
                x: targetBounds.maxX + movingBounds.halfX
            }
        },
        {
            axis: "z",
            movingFace: "front",
            targetFace: "back",
            distance: Math.abs(movingBounds.maxZ - targetBounds.minZ),
            overlap: xOverlap,
            position: {
                ...moving.position,
                z: targetBounds.minZ - movingBounds.halfZ
            }
        },
        {
            axis: "z",
            movingFace: "back",
            targetFace: "front",
            distance: Math.abs(movingBounds.minZ - targetBounds.maxZ),
            overlap: xOverlap,
            position: {
                ...moving.position,
                z: targetBounds.maxZ + movingBounds.halfZ
            }
        }
    ];
}

function getBounds(module: StandModule): Bounds {
    const halfWidth = module.width / 2;
    const halfDepth = module.depth / 2;
    const cos = Math.abs(Math.cos(module.rotation));
    const sin = Math.abs(Math.sin(module.rotation));
    const halfX = halfWidth * cos + halfDepth * sin;
    const halfZ = halfWidth * sin + halfDepth * cos;

    return {
        minX: module.position.x - halfX,
        maxX: module.position.x + halfX,
        minZ: module.position.z - halfZ,
        maxZ: module.position.z + halfZ,
        halfX,
        halfZ
    };
}
