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

export interface SquareBannerSegment {
    index: number;
    panelWidth: number;
    centerX: number;
    centerZ: number;
    rotationY: number;
}

export interface SquareBannerDivider {
    x: number;
    z: number;
    rotationY: number;
}

export function getSquareBannerOuterHalf(module: Pick<StandModule, "width">) {
    return module.width / 2;
}

export function getSquareBannerInnerHalf(module: Pick<StandModule, "width" | "depth">) {
    return Math.max(
        getSquareBannerOuterHalf(module) - module.depth,
        0.01
    );
}

export function getSquareBannerMidHalf(module: Pick<StandModule, "width" | "depth">) {
    return (getSquareBannerOuterHalf(module) + getSquareBannerInnerHalf(module)) / 2;
}

export function getSquareBannerSegmentWidth(
    module: Pick<StandModule, "width" | "segmentCount">
) {
    return (module.width * 4) / getBannerSegmentCount(module);
}

export function getSquareBannerInnerSideLength(
    module: Pick<StandModule, "width" | "depth">
) {
    return 2 * getSquareBannerInnerHalf(module);
}

export function getSquareBannerInnerSegmentWidth(
    module: Pick<StandModule, "width" | "depth" | "segmentCount">
) {
    return (getSquareBannerInnerSideLength(module) * 4) / getBannerSegmentCount(module);
}

export function getSquareBannerSegmentWidthForLayer(
    module: Pick<StandModule, "width" | "depth" | "segmentCount">,
    layer: BannerFabricLayer
) {
    return layer === "outside"
        ? getSquareBannerSegmentWidth(module)
        : getSquareBannerInnerSegmentWidth(module);
}

export function getSquareBannerSegmentCenter(
    module: StandModule,
    index: number,
    layer: BannerFabricLayer
) {
    if (layer === "outside") {
        const segmentWidth = getSquareBannerSegmentWidth(module);
        const centerDist = index * segmentWidth + segmentWidth / 2;

        return getSquarePerimeterPoint(
            centerDist,
            getSquareBannerOuterHalf(module),
            module.width
        );
    }

    const segmentWidth = getSquareBannerInnerSegmentWidth(module);
    const centerDist = index * segmentWidth + segmentWidth / 2;

    return getSquarePerimeterPoint(
        centerDist,
        getSquareBannerInnerHalf(module),
        getSquareBannerInnerSideLength(module)
    );
}

function getSquarePerimeterPoint(
    distance: number,
    halfSize: number,
    sideLength: number
): { x: number; z: number; rotationY: number } {
    const perimeter = sideLength * 4;
    const wrapped = ((distance % perimeter) + perimeter) % perimeter;
    const side = Math.floor(wrapped / sideLength);
    const t = (wrapped % sideLength) / sideLength;

    switch (side) {
        case 0:
            return {
                x: -halfSize + t * sideLength,
                z: -halfSize,
                rotationY: 0
            };
        case 1:
            return {
                x: halfSize,
                z: -halfSize + t * sideLength,
                rotationY: -Math.PI / 2
            };
        case 2:
            return {
                x: halfSize - t * sideLength,
                z: halfSize,
                rotationY: Math.PI
            };
        default:
            return {
                x: -halfSize,
                z: halfSize - t * sideLength,
                rotationY: Math.PI / 2
            };
    }
}

export function getSquareBannerSegments(module: StandModule): SquareBannerSegment[] {
    const segmentCount = getBannerSegmentCount(module);
    const segmentWidth = getSquareBannerSegmentWidth(module);
    const halfSize = getSquareBannerOuterHalf(module);

    return Array.from({ length: segmentCount }, (_, index) => {
        const centerDist = index * segmentWidth + segmentWidth / 2;
        const { x, z, rotationY } = getSquarePerimeterPoint(
            centerDist,
            halfSize,
            module.width
        );

        return {
            index,
            panelWidth: segmentWidth,
            centerX: x,
            centerZ: z,
            rotationY
        };
    });
}

export function getSquareBannerDividerPositions(module: StandModule): SquareBannerDivider[] {
    const segmentCount = getBannerSegmentCount(module);
    const segmentWidth = getSquareBannerSegmentWidth(module);
    const midHalf = getSquareBannerMidHalf(module);

    return Array.from({ length: segmentCount }, (_, index) => {
        const dist = index * segmentWidth;

        return getSquarePerimeterPoint(dist, midHalf, module.width);
    });
}

export function getSquareMidSpan(module: Pick<StandModule, "width" | "depth">) {
    return module.width - module.depth;
}

export function isSquareBannerCornerDivider(
    dividerIndex: number,
    module: Pick<StandModule, "width" | "segmentCount">
) {
    const segmentWidth = getSquareBannerSegmentWidth(module);
    const dist = dividerIndex * segmentWidth;
    const ratio = dist / module.width;

    return Math.abs(ratio - Math.round(ratio)) < 1e-6;
}
