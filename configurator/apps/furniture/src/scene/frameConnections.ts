import type { StandModule } from "../models/ModuleModel";
import { isHangingBannerType } from "../models/ModuleModel";
import type { HiddenFrameSides } from "./WallFrame";

const CONNECTION_TOLERANCE = 0.025;
const ROTATION_TOLERANCE = 0.001;

export interface FabricMergeLayout {
    isLeader: boolean;
    width: number;
    centerOffsetX: number;
    members: StandModule[];
}

export interface FrameConnectionLayout {
    hiddenSides: HiddenFrameSides;
    fabric: FabricMergeLayout;
}

export function getFrameConnectionLayout(
    module: StandModule,
    modules: StandModule[]
): FrameConnectionLayout {
    if (module.type === "cube" || module.type === "promoStand" || isHangingBannerType(module.type)) {
        return {
            hiddenSides: {},
            fabric: {
                isLeader: true,
                width: module.width,
                centerOffsetX: 0,
                members: [module]
            }
        };
    }

    const connectedModules = getConnectedFrameGroup(module, modules);
    const hiddenSides = getHiddenSides(module, connectedModules);
    const fabric = getFabricMergeLayout(module, connectedModules);

    return {
        hiddenSides,
        fabric
    };
}

function getConnectedFrameGroup(
    module: StandModule,
    modules: StandModule[]
) {
    const connected = new Map<string, StandModule>();
    const queue = [module];

    connected.set(module.id, module);

    while (queue.length > 0) {
        const current = queue.shift();

        if (!current) {
            break;
        }

        for (const candidate of modules) {
            if (
                connected.has(candidate.id) ||
                !canConnectFrames(current, candidate)
            ) {
                continue;
            }

            connected.set(candidate.id, candidate);
            queue.push(candidate);
        }
    }

    return [...connected.values()];
}

function getHiddenSides(
    module: StandModule,
    connectedModules: StandModule[]
): HiddenFrameSides {
    const hiddenSides: HiddenFrameSides = {};

    for (const other of connectedModules) {
        if (other.id === module.id) {
            continue;
        }

        const localX = getLocalOffset(module, other).x;
        const targetDistance = (module.width + other.width) / 2;

        if (Math.abs(Math.abs(localX) - targetDistance) > CONNECTION_TOLERANCE) {
            continue;
        }

        if (localX > 0) {
            hiddenSides.right = true;
        } else {
            hiddenSides.left = true;
        }
    }

    return hiddenSides;
}

function getFabricMergeLayout(
    module: StandModule,
    connectedModules: StandModule[]
): FabricMergeLayout {
    const extents = connectedModules.map(member => {
        const localX = getLocalOffset(module, member).x;

        return {
            module: member,
            id: member.id,
            minX: localX - member.width / 2,
            maxX: localX + member.width / 2
        };
    });
    const firstExtent = extents[0];

    if (!firstExtent) {
        return {
            isLeader: true,
            width: module.width,
            centerOffsetX: 0,
            members: [module]
        };
    }

    const minX = Math.min(...extents.map(extent => extent.minX));
    const maxX = Math.max(...extents.map(extent => extent.maxX));
    const leader = extents.reduce((leftmost, current) => {
        if (current.minX < leftmost.minX) {
            return current;
        }

        if (current.minX === leftmost.minX && current.id < leftmost.id) {
            return current;
        }

        return leftmost;
    }, firstExtent);
    const members = [...extents]
        .sort((a, b) => a.minX - b.minX)
        .map(extent => extent.module);

    return {
        isLeader: leader.id === module.id,
        width: maxX - minX,
        centerOffsetX: (minX + maxX) / 2,
        members
    };
}

function canConnectFrames(module: StandModule, other: StandModule) {
    if (module.type !== "wall" || other.type !== "wall") {
        return false;
    }

    const localOffset = getLocalOffset(module, other);
    const targetDistance = (module.width + other.width) / 2;

    return (
        isSameOrientation(module, other) &&
        Math.abs(localOffset.z) <= CONNECTION_TOLERANCE &&
        Math.abs(Math.abs(localOffset.x) - targetDistance) <= CONNECTION_TOLERANCE &&
        Math.abs(module.position.y - other.position.y) <= CONNECTION_TOLERANCE &&
        Math.abs(module.height - other.height) <= CONNECTION_TOLERANCE
    );
}

function isSameOrientation(module: StandModule, other: StandModule) {
    return Math.abs(normalizeAngle(module.rotation - other.rotation)) <= ROTATION_TOLERANCE;
}

function normalizeAngle(rotation: number) {
    return Math.atan2(Math.sin(rotation), Math.cos(rotation));
}

function getLocalOffset(origin: StandModule, target: StandModule) {
    const dx = target.position.x - origin.position.x;
    const dz = target.position.z - origin.position.z;
    const cos = Math.cos(origin.rotation);
    const sin = Math.sin(origin.rotation);

    return {
        x: dx * cos - dz * sin,
        z: dx * sin + dz * cos
    };
}
