import type {
    BannerFabricLayer,
    BannerFabricSide,
    FabricSide,
    ModuleFabrics
} from "../models/ModuleModel";
import {
    DEFAULT_BANNER_SEGMENT_COUNT,
    MAX_BANNER_SEGMENT_COUNT,
    MIN_BANNER_SEGMENT_COUNT
} from "./bannerGeometry";

export function createBannerFabricSide(
    layer: BannerFabricLayer,
    index: number
): BannerFabricSide {
    return `${layer}-${index}`;
}

export function parseBannerFabricSide(
    side: FabricSide
): { layer: BannerFabricLayer; index: number } | null {
    const match = /^(outside|inside)-(\d+)$/.exec(side);

    if (!match) {
        return null;
    }

    return {
        layer: match[1] as BannerFabricLayer,
        index: Number(match[2])
    };
}

export function isBannerFabricSide(side: FabricSide): side is BannerFabricSide {
    return parseBannerFabricSide(side) !== null;
}

export function formatBannerFabricLabel(side: BannerFabricSide) {
    const parsed = parseBannerFabricSide(side);

    if (!parsed) {
        return side;
    }

    const layerLabel = parsed.layer === "outside" ? "Outside" : "Inside";

    return `${layerLabel} ${parsed.index + 1}`;
}

export function clampBannerSegmentCount(value: number) {
    return Math.min(
        MAX_BANNER_SEGMENT_COUNT,
        Math.max(MIN_BANNER_SEGMENT_COUNT, Math.round(value))
    );
}

function createDefaultFabricInfo() {
    return {
        isBlockout: false,
        isLuminous: false,
        artwork: null
    };
}

export function createDefaultBannerFabrics(
    segmentCount = DEFAULT_BANNER_SEGMENT_COUNT
): ModuleFabrics {
    const count = clampBannerSegmentCount(segmentCount);
    const fabrics: ModuleFabrics = {};

    for (let index = 0; index < count; index += 1) {
        fabrics[createBannerFabricSide("outside", index)] = createDefaultFabricInfo();
        fabrics[createBannerFabricSide("inside", index)] = createDefaultFabricInfo();
    }

    return fabrics;
}

export function getBannerFabricSides(segmentCount: number): FabricSide[] {
    const count = clampBannerSegmentCount(segmentCount);
    const sides: FabricSide[] = [];

    for (let index = 0; index < count; index += 1) {
        sides.push(createBannerFabricSide("outside", index));
        sides.push(createBannerFabricSide("inside", index));
    }

    return sides;
}

export function resizeBannerFabrics(
    fabrics: ModuleFabrics | undefined,
    segmentCount: number
): ModuleFabrics {
    const next = createDefaultBannerFabrics(segmentCount);

    if (!fabrics) {
        return next;
    }

    for (const side of getBannerFabricSides(segmentCount)) {
        if (fabrics[side]) {
            next[side] = { ...fabrics[side] };
        }
    }

    return next;
}

export { createDefaultFabricInfo };
