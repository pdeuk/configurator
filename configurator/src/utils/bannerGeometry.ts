import type { BannerFabricLayer, StandModule } from "../models/ModuleModel";

export const DEFAULT_BANNER_SEGMENT_COUNT = 4;
export const MIN_BANNER_SEGMENT_COUNT = 3;
export const MAX_BANNER_SEGMENT_COUNT = 16;

export interface BannerArcSegment {
    index: number;
    thetaStart: number;
    thetaLength: number;
    outerRadius: number;
    innerRadius: number;
}

export function getBannerSegmentCount(module: Pick<StandModule, "segmentCount">) {
    return module.segmentCount ?? DEFAULT_BANNER_SEGMENT_COUNT;
}

export function getBannerOuterRadius(module: Pick<StandModule, "width">) {
    return module.width / 2;
}

export function getBannerRingThickness(module: Pick<StandModule, "depth">) {
    return module.depth;
}

export function getBannerInnerRadius(module: Pick<StandModule, "width" | "depth">) {
    return Math.max(
        getBannerOuterRadius(module) - getBannerRingThickness(module),
        0.01
    );
}

export function getBannerMidRadius(module: Pick<StandModule, "width" | "depth">) {
    return (getBannerOuterRadius(module) + getBannerInnerRadius(module)) / 2;
}

export function getBannerSegmentAngle(module: Pick<StandModule, "segmentCount">) {
    return (Math.PI * 2) / getBannerSegmentCount(module);
}

export function getBannerSegmentThetaStart(
    index: number,
    segmentCount: number
) {
    const segmentAngle = (Math.PI * 2) / segmentCount;

    return index * segmentAngle - Math.PI / 2;
}

export function getBannerSegmentArcWidth(
    module: Pick<StandModule, "width" | "depth" | "segmentCount">,
    layer: BannerFabricLayer
) {
    const radius = layer === "outside"
        ? getBannerOuterRadius(module)
        : getBannerInnerRadius(module);

    return radius * getBannerSegmentAngle(module);
}

export function getBannerArcSegments(module: StandModule): BannerArcSegment[] {
    const segmentCount = getBannerSegmentCount(module);
    const segmentAngle = getBannerSegmentAngle(module);
    const outerRadius = getBannerOuterRadius(module);
    const innerRadius = getBannerInnerRadius(module);

    return Array.from({ length: segmentCount }, (_, index) => ({
        index,
        thetaStart: getBannerSegmentThetaStart(index, segmentCount),
        thetaLength: segmentAngle,
        outerRadius,
        innerRadius
    }));
}

export function getBannerRadialDividerAngles(module: StandModule) {
    const segmentCount = getBannerSegmentCount(module);
    const segmentAngle = getBannerSegmentAngle(module);

    return Array.from(
        { length: segmentCount },
        (_, index) => index * segmentAngle - Math.PI / 2
    );
}

export function getBannerSelectionHitSize(module: StandModule) {
    return {
        width: module.width,
        height: module.height,
        depth: module.width
    };
}
