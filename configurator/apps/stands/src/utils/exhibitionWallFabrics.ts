import type {
    BannerFabricSide,
    FabricSide,
    ModuleFabrics,
    ModuleType
} from "../models/ModuleModel";
import {
    createBannerFabricSide,
    createDefaultFabricInfo
} from "./bannerFabrics";
import {
    clampExhibitionWallSegmentCount,
    getExhibitionWallSegmentCount
} from "./exhibitionWallGeometry";
import type { StandModule } from "../models/ModuleModel";

export function createExhibitionWallFabrics(
    segmentCount = 1
): ModuleFabrics {
    const count = clampExhibitionWallSegmentCount(segmentCount);
    const fabrics: ModuleFabrics = {};

    for (let index = 0; index < count; index += 1) {
        fabrics[createBannerFabricSide("outside", index)] = createDefaultFabricInfo();
        fabrics[createBannerFabricSide("inside", index)] = createDefaultFabricInfo();
    }

    return fabrics;
}

export function getExhibitionWallFabricSides(segmentCount: number): FabricSide[] {
    const count = clampExhibitionWallSegmentCount(segmentCount);
    const sides: FabricSide[] = [];

    for (let index = 0; index < count; index += 1) {
        sides.push(createBannerFabricSide("outside", index));
        sides.push(createBannerFabricSide("inside", index));
    }

    return sides;
}

export function resizeExhibitionWallFabrics(
    fabrics: ModuleFabrics | undefined,
    segmentCount: number
): ModuleFabrics {
    const next = createExhibitionWallFabrics(segmentCount);

    if (!fabrics) {
        return next;
    }

    for (const side of getExhibitionWallFabricSides(segmentCount)) {
        if (fabrics[side]) {
            next[side] = { ...fabrics[side] };
        }
    }

    return next;
}

export function formatSegmentFabricLabel(
    side: BannerFabricSide,
    moduleType?: ModuleType
) {
    const match = /^(outside|inside)-(\d+)$/.exec(side);

    if (!match) {
        return side;
    }

    const layer = match[1] as "outside" | "inside";
    const index = Number(match[2]);
    const layerLabel = moduleType === "exhibitionWall"
        ? (layer === "outside" ? "Front" : "Back")
        : (layer === "outside" ? "Outside" : "Inside");

    return `${layerLabel} ${index + 1}`;
}

export function getExhibitionWallSegmentCountFromModule(
    module: Pick<StandModule, "segmentCount">
) {
    return getExhibitionWallSegmentCount(module);
}
