import type { StandModule } from "../models/ModuleModel";

export const DEFAULT_EXHIBITION_WALL_SEGMENT_COUNT = 1;
export const MIN_EXHIBITION_WALL_SEGMENT_COUNT = 1;
export const MAX_EXHIBITION_WALL_SEGMENT_COUNT = 16;

export function getExhibitionWallSegmentCount(
    module: Pick<StandModule, "segmentCount">
) {
    return module.segmentCount ?? DEFAULT_EXHIBITION_WALL_SEGMENT_COUNT;
}

export function clampExhibitionWallSegmentCount(value: number) {
    return Math.min(
        MAX_EXHIBITION_WALL_SEGMENT_COUNT,
        Math.max(MIN_EXHIBITION_WALL_SEGMENT_COUNT, Math.round(value))
    );
}

export function getExhibitionWallSegmentWidth(
    module: Pick<StandModule, "width" | "segmentCount">
) {
    return module.width / getExhibitionWallSegmentCount(module);
}

export function getExhibitionWallSegmentCenterX(
    module: Pick<StandModule, "width" | "segmentCount">,
    index: number
) {
    const segmentWidth = getExhibitionWallSegmentWidth(module);

    return -module.width / 2 + index * segmentWidth + segmentWidth / 2;
}

/** Vertical divider positions between face panels (not at outer edges). */
export function getExhibitionWallDividerPositions(
    module: Pick<StandModule, "width" | "segmentCount">
) {
    const segmentCount = getExhibitionWallSegmentCount(module);
    const segmentWidth = getExhibitionWallSegmentWidth(module);

    return Array.from(
        { length: Math.max(segmentCount - 1, 0) },
        (_, index) => -module.width / 2 + (index + 1) * segmentWidth
    );
}
