import { Euler, Quaternion, Vector3 } from "three";
import type { FabricSide, StandModule } from "../models/ModuleModel";
import { isPromoStandType } from "../models/ModuleModel";
import type { FrameConnectionLayout } from "../scene/frameConnections";
import {
    createBannerFabricSide,
    getFabricDimensions,
    getRailThickness,
    parseBannerFabricSide
} from "./fabrics";
import {
    getBannerArcSegments,
    getBannerSegmentArcWidth,
    getSquareBannerInnerHalf,
    getSquareBannerOuterHalf,
    getSquareBannerSegmentCenter,
    getSquareBannerSegmentWidthForLayer,
    getSquareBannerSegments
} from "./bannerGeometry";

const FABRIC_INSET = 0.003;

export interface FabricFaceLayout {
    panelWidth: number;
    panelHeight: number;
    position: [number, number, number];
    rotation: [number, number, number];
}

export interface FabricFaceWorldFrame {
    center: Vector3;
    normal: Vector3;
    up: Vector3;
    width: number;
    height: number;
}

function getCubeFaceLayout(module: StandModule, side: FabricSide): FabricFaceLayout {
    const dimensions = getFabricDimensions(module, side);
    const halfWidth = module.width / 2;
    const halfHeight = module.height / 2;
    const halfDepth = module.depth / 2;

    switch (side) {
        case "front":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, -halfDepth - FABRIC_INSET],
                rotation: [0, Math.PI, 0]
            };
        case "back":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, halfDepth + FABRIC_INSET],
                rotation: [0, 0, 0]
            };
        case "left":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [-halfWidth - FABRIC_INSET, 0, 0],
                rotation: [0, -Math.PI / 2, 0]
            };
        case "right":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [halfWidth + FABRIC_INSET, 0, 0],
                rotation: [0, Math.PI / 2, 0]
            };
        case "top":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, halfHeight + FABRIC_INSET, 0],
                rotation: [-Math.PI / 2, 0, 0]
            };
        default:
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, 0],
                rotation: [0, 0, 0]
            };
    }
}

function getPromoStandFaceLayout(module: StandModule, side: FabricSide): FabricFaceLayout | null {
    const dimensions = getFabricDimensions(module, side);
    const halfWidth = module.width / 2;
    const halfDepth = module.depth / 2;
    const rail = getRailThickness(module);
    const innerWidth = Math.max(module.width - rail * 2, rail);
    const innerHeight = Math.max(module.height - rail * 2, rail);

    switch (side) {
        case "front":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [0, 0, -halfDepth - FABRIC_INSET],
                rotation: [0, Math.PI, 0]
            };
        case "left":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [-halfWidth - FABRIC_INSET, 0, 0],
                rotation: [0, -Math.PI / 2, 0]
            };
        case "right":
            return {
                panelWidth: dimensions.width,
                panelHeight: dimensions.height,
                position: [halfWidth + FABRIC_INSET, 0, 0],
                rotation: [0, Math.PI / 2, 0]
            };
        case "inside":
            return {
                panelWidth: innerWidth,
                panelHeight: innerHeight,
                position: [0, 0, halfDepth - rail - FABRIC_INSET],
                rotation: [0, Math.PI, 0]
            };
        default:
            return null;
    }
}

function getWallFaceLayout(
    module: StandModule,
    side: FabricSide,
    connectionLayout: FrameConnectionLayout
): FabricFaceLayout | null {
    if (side !== "front" && side !== "back") {
        return null;
    }

    const zOffset = side === "front"
        ? -module.depth / 2 - FABRIC_INSET
        : module.depth / 2 + FABRIC_INSET;

    return {
        panelWidth: connectionLayout.fabric.width,
        panelHeight: module.height,
        position: [connectionLayout.fabric.centerOffsetX, 0, zOffset],
        rotation: [0, side === "front" ? Math.PI : 0, 0]
    };
}

function getSquareBannerFaceLayout(
    module: StandModule,
    side: FabricSide
): FabricFaceLayout | null {
    const parsed = parseBannerFabricSide(side);

    if (!parsed) {
        return null;
    }

    const segments = getSquareBannerSegments(module);
    const segment = segments[parsed.index];

    if (!segment) {
        return null;
    }

    const outerHalf = getSquareBannerOuterHalf(module);
    const innerHalf = getSquareBannerInnerHalf(module);
    const panelWidth = getSquareBannerSegmentWidthForLayer(module, parsed.layer);
    const center = getSquareBannerSegmentCenter(module, parsed.index, parsed.layer);
    const placement = getSquareBannerPlacement(
        center.rotationY,
        parsed.layer,
        center.x,
        center.z,
        outerHalf,
        innerHalf
    );

    return {
        panelWidth,
        panelHeight: module.height,
        position: placement.position,
        rotation: placement.rotation
    };
}

function getSquareBannerPlacement(
    rotationY: number,
    layer: "outside" | "inside",
    centerX: number,
    centerZ: number,
    outerHalf: number,
    innerHalf: number
) {
    if (rotationY === 0) {
        const z = layer === "outside"
            ? -outerHalf - FABRIC_INSET
            : -innerHalf + FABRIC_INSET;

        return {
            position: [centerX, 0, z] as [number, number, number],
            rotation: (layer === "outside" ? [0, Math.PI, 0] : [0, 0, 0]) as [number, number, number]
        };
    }

    if (rotationY === -Math.PI / 2) {
        const x = layer === "outside"
            ? outerHalf + FABRIC_INSET
            : innerHalf - FABRIC_INSET;

        return {
            position: [x, 0, centerZ] as [number, number, number],
            rotation: (layer === "outside"
                ? [0, Math.PI / 2, 0]
                : [0, -Math.PI / 2, 0]) as [number, number, number]
        };
    }

    if (rotationY === Math.PI) {
        const z = layer === "outside"
            ? outerHalf + FABRIC_INSET
            : innerHalf - FABRIC_INSET;

        return {
            position: [centerX, 0, z] as [number, number, number],
            rotation: (layer === "outside" ? [0, 0, 0] : [0, Math.PI, 0]) as [number, number, number]
        };
    }

    const x = layer === "outside"
        ? -outerHalf - FABRIC_INSET
        : -innerHalf + FABRIC_INSET;

    return {
        position: [x, 0, centerZ] as [number, number, number],
        rotation: (layer === "outside"
            ? [0, -Math.PI / 2, 0]
            : [0, Math.PI / 2, 0]) as [number, number, number]
    };
}

function getCircularBannerFaceLayout(
    module: StandModule,
    side: FabricSide
): FabricFaceLayout | null {
    const parsed = parseBannerFabricSide(side);

    if (!parsed) {
        return null;
    }

    const segments = getBannerArcSegments(module);
    const segment = segments[parsed.index];

    if (!segment) {
        return null;
    }

    const midTheta = segment.thetaStart + segment.thetaLength / 2;
    const radius = parsed.layer === "outside"
        ? segment.outerRadius - FABRIC_INSET
        : segment.innerRadius + FABRIC_INSET;
    const x = Math.sin(midTheta) * radius;
    const z = -Math.cos(midTheta) * radius;
    const panelWidth = getBannerSegmentArcWidth(module, parsed.layer);
    const rotationY = midTheta + (parsed.layer === "outside" ? Math.PI : 0);

    return {
        panelWidth,
        panelHeight: module.height,
        position: [x, 0, z],
        rotation: [0, rotationY, 0]
    };
}

export function getFabricFaceLayout(
    module: StandModule,
    side: FabricSide,
    connectionLayout: FrameConnectionLayout
): FabricFaceLayout | null {
    if (module.type === "wall") {
        return getWallFaceLayout(module, side, connectionLayout);
    }

    if (module.type === "cube") {
        return getCubeFaceLayout(module, side);
    }

    if (isPromoStandType(module.type)) {
        return getPromoStandFaceLayout(module, side);
    }

    if (module.type === "squareBanner") {
        return getSquareBannerFaceLayout(module, side);
    }

    if (module.type === "circularBanner") {
        return getCircularBannerFaceLayout(module, side);
    }

    return null;
}

export function getFabricFaceWorldFrame(
    module: StandModule,
    layout: FabricFaceLayout
): FabricFaceWorldFrame {
    const modulePosition = new Vector3(
        module.position.x,
        module.position.y + module.height / 2,
        module.position.z
    );
    const moduleQuaternion = new Quaternion().setFromEuler(
        new Euler(0, module.rotation, 0)
    );
    const localPosition = new Vector3(...layout.position);
    const localQuaternion = new Quaternion().setFromEuler(
        new Euler(...layout.rotation)
    );

    const center = localPosition
        .clone()
        .applyQuaternion(moduleQuaternion)
        .add(modulePosition);
    const normal = new Vector3(0, 0, 1)
        .applyQuaternion(localQuaternion)
        .applyQuaternion(moduleQuaternion)
        .normalize();
    const up = new Vector3(0, 1, 0)
        .applyQuaternion(localQuaternion)
        .applyQuaternion(moduleQuaternion)
        .normalize();

    return {
        center,
        normal,
        up,
        width: layout.panelWidth,
        height: layout.panelHeight
    };
}

export function isEditableFabricSide(
    module: StandModule,
    side: FabricSide,
    connectionLayout: FrameConnectionLayout
): boolean {
    if (module.type === "wall" && !connectionLayout.fabric.isLeader) {
        return false;
    }

    if (parseBannerFabricSide(side)) {
        return getFabricFaceLayout(module, side, connectionLayout) !== null;
    }

    return getFabricFaceLayout(module, side, connectionLayout) !== null;
}

export { createBannerFabricSide };
