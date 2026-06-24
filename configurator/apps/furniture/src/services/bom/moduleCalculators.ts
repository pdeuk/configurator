import type { ProjectFabricKind, ProjectModule } from "../../models/ProjectModel";
import type { FabricSide, StandModule } from "../../models/ModuleModel";
import { isHangingBannerType, isPromoStandType } from "../../models/ModuleModel";
import {
    getFabricDimensions,
    getFabricSidesForModule,
    getRailThickness,
    isCubeMelamineTopActive,
    MELAMINE_TOP_EXCESS,
    metersToCentimeters
} from "../../utils/fabrics";
import { getBannerSegmentCount } from "../../utils/bannerGeometry";
import type { BOMLine, BOMLineDimensions } from "./BOMModel";

export interface ModuleBOMContext {
    module: ProjectModule;
    moduleShape: StandModule;
}

export function projectModuleToStandModuleShape(module: ProjectModule): StandModule {
    return {
        id: module.id,
        type: module.type,
        position: module.position,
        rotation: module.rotation,
        width: module.dimensions.width,
        height: module.dimensions.height,
        depth: module.dimensions.depth,
        ...(module.segmentCount !== undefined ? { segmentCount: module.segmentCount } : {}),
        ...(module.hasMelamineTop !== undefined ? { hasMelamineTop: module.hasMelamineTop } : {}),
        snappedTo: module.snappedTo ?? null
    };
}

function roundQuantity(value: number, decimals = 2): number {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
}

function formatSizeLabel(widthCm: number, heightCm: number, depthCm?: number): string {
    const width = Math.round(widthCm);
    const height = Math.round(heightCm);

    if (depthCm !== undefined) {
        return `${width}×${height}×${Math.round(depthCm)} cm`;
    }

    return `${width}×${height} cm`;
}

function createDimensions(
    widthMeters: number,
    heightMeters: number,
    face?: FabricSide | string,
    depthMeters?: number
): BOMLineDimensions {
    return {
        widthCm: roundQuantity(metersToCentimeters(widthMeters), 1),
        heightCm: roundQuantity(metersToCentimeters(heightMeters), 1),
        ...(depthMeters !== undefined
            ? { depthCm: roundQuantity(metersToCentimeters(depthMeters), 1) }
            : {}),
        ...(face !== undefined ? { face } : {})
    };
}

function createLine(
    partial: Omit<BOMLine, "id"> & { id?: string }
): BOMLine {
    return {
        id: partial.id ?? crypto.randomUUID(),
        category: partial.category,
        name: partial.name,
        quantity: partial.quantity,
        unit: partial.unit,
        dimensions: partial.dimensions,
        sourceModuleId: partial.sourceModuleId
    };
}

function getPrintableFabricSides(context: ModuleBOMContext): FabricSide[] {
    const sides = getFabricSidesForModule(context.moduleShape);

    if (isCubeMelamineTopActive(context.moduleShape)) {
        return sides.filter(side => side !== "top");
    }

    return sides;
}

function getFabricKindLabel(fabricKind: ProjectFabricKind): string {
    switch (fabricKind) {
        case "blockout":
            return "Blockout Fabric";
        case "luminous":
            return "Luminous Fabric";
        case "standard":
            return "Printed Fabric";
    }
}

function getProjectFabricKind(
    module: ProjectModule,
    side: FabricSide
): ProjectFabricKind {
    const fabric = module.fabrics.find(entry => entry.side === side);

    return fabric?.fabricKind ?? "standard";
}

export interface FabricAreaContribution {
    fabricKind: ProjectFabricKind;
    areaSquareMeters: number;
    moduleId: StandModule["id"];
    face: FabricSide;
}

export function collectWallLines(context: ModuleBOMContext): BOMLine[] {
    const { module } = context;
    const widthCm = metersToCentimeters(module.dimensions.width);
    const heightCm = metersToCentimeters(module.dimensions.height);

    return [
        createLine({
            category: "frame",
            name: `${formatSizeLabel(widthCm, heightCm)} Wall Frame`,
            quantity: 1,
            unit: "pcs",
            dimensions: createDimensions(
                module.dimensions.width,
                module.dimensions.height,
                undefined,
                module.dimensions.depth
            ),
            sourceModuleId: module.id
        })
    ];
}

export function collectCubeLines(context: ModuleBOMContext): BOMLine[] {
    const { module, moduleShape } = context;
    const widthCm = metersToCentimeters(module.dimensions.width);
    const heightCm = metersToCentimeters(module.dimensions.height);
    const depthCm = metersToCentimeters(module.dimensions.depth);
    const lines: BOMLine[] = [
        createLine({
            category: "panel",
            name: `${formatSizeLabel(widthCm, heightCm, depthCm)} Cube Frame`,
            quantity: 1,
            unit: "pcs",
            dimensions: createDimensions(
                module.dimensions.width,
                module.dimensions.height,
                undefined,
                module.dimensions.depth
            ),
            sourceModuleId: module.id
        })
    ];

    if (isCubeMelamineTopActive(moduleShape)) {
        lines.push(createLine({
            category: "melamine",
            name: `${formatSizeLabel(widthCm, depthCm)} Melamine Top`,
            quantity: 1,
            unit: "pcs",
            dimensions: createDimensions(
                module.dimensions.width + MELAMINE_TOP_EXCESS * 2,
                module.dimensions.depth + MELAMINE_TOP_EXCESS * 2,
                "top"
            ),
            sourceModuleId: module.id
        }));
    }

    return lines;
}

export function collectPromoStandLines(context: ModuleBOMContext): BOMLine[] {
    const { module, moduleShape } = context;
    const widthCm = metersToCentimeters(module.dimensions.width);
    const heightCm = metersToCentimeters(module.dimensions.height);
    const depthCm = metersToCentimeters(module.dimensions.depth);
    const rail = getRailThickness(moduleShape);
    const innerWidth = Math.max(module.dimensions.width - rail * 2, rail);
    const innerDepth = Math.max(module.dimensions.depth - rail * 2, rail);

    return [
        createLine({
            category: "frame",
            name: `${formatSizeLabel(widthCm, heightCm, depthCm)} Promo Stand Frame`,
            quantity: 1,
            unit: "pcs",
            dimensions: createDimensions(
                module.dimensions.width,
                module.dimensions.height,
                undefined,
                module.dimensions.depth
            ),
            sourceModuleId: module.id
        }),
        createLine({
            category: "melamine",
            name: `${formatSizeLabel(widthCm, depthCm)} Melamine Top`,
            quantity: 1,
            unit: "pcs",
            dimensions: createDimensions(
                module.dimensions.width + MELAMINE_TOP_EXCESS * 2,
                module.dimensions.depth + MELAMINE_TOP_EXCESS * 2,
                "top"
            ),
            sourceModuleId: module.id
        }),
        createLine({
            category: "shelf",
            name: `${formatSizeLabel(
                metersToCentimeters(innerWidth),
                metersToCentimeters(innerDepth)
            )} Melamine Shelf`,
            quantity: 1,
            unit: "pcs",
            dimensions: createDimensions(innerWidth, innerDepth, "shelf"),
            sourceModuleId: module.id
        }),
        createLine({
            category: "door",
            name: `${formatSizeLabel(
                metersToCentimeters(innerWidth / 2),
                metersToCentimeters(module.dimensions.height - rail * 2)
            )} Back Door`,
            quantity: 2,
            unit: "pcs",
            dimensions: createDimensions(
                innerWidth / 2,
                Math.max(module.dimensions.height - rail * 2, rail),
                "back"
            ),
            sourceModuleId: module.id
        })
    ];
}

export function collectBannerLines(context: ModuleBOMContext): BOMLine[] {
    const { module, moduleShape } = context;
    const segmentCount = getBannerSegmentCount(moduleShape);
    const bannerLabel = module.type === "circularBanner"
        ? "Circular Banner Frame"
        : "Square Banner Frame";
    const widthCm = metersToCentimeters(module.dimensions.width);
    const heightCm = metersToCentimeters(module.dimensions.height);

    return [
        createLine({
            category: "banner",
            name: `${bannerLabel} (${segmentCount} segments)`,
            quantity: 1,
            unit: "pcs",
            dimensions: {
                widthCm: roundQuantity(widthCm, 1),
                heightCm: roundQuantity(heightCm, 1),
                face: `${segmentCount} segments`
            },
            sourceModuleId: module.id
        })
    ];
}

export function collectFabricAreas(context: ModuleBOMContext): FabricAreaContribution[] {
    const { module, moduleShape } = context;
    const contributions: FabricAreaContribution[] = [];

    for (const side of getPrintableFabricSides(context)) {
        const dimensions = getFabricDimensions(moduleShape, side);
        contributions.push({
            fabricKind: getProjectFabricKind(module, side),
            areaSquareMeters: dimensions.width * dimensions.height,
            moduleId: module.id,
            face: side
        });
    }

    return contributions;
}

export function aggregateFabricLines(
    contributions: FabricAreaContribution[]
): BOMLine[] {
    const totals = new Map<ProjectFabricKind, number>();

    for (const contribution of contributions) {
        totals.set(
            contribution.fabricKind,
            (totals.get(contribution.fabricKind) ?? 0) + contribution.areaSquareMeters
        );
    }

    return [...totals.entries()]
        .filter(([, area]) => area > 0)
        .map(([fabricKind, areaSquareMeters]) =>
            createLine({
                category: "fabric",
                name: getFabricKindLabel(fabricKind),
                quantity: roundQuantity(areaSquareMeters),
                unit: "m2",
                dimensions: null,
                sourceModuleId: null
            })
        );
}

export function collectModuleLines(context: ModuleBOMContext): BOMLine[] {
    const { module } = context;

    if (module.type === "wall" || module.type === "corner") {
        return collectWallLines(context);
    }

    if (module.type === "cube") {
        return collectCubeLines(context);
    }

    if (isPromoStandType(module.type)) {
        return collectPromoStandLines(context);
    }

    if (isHangingBannerType(module.type)) {
        return collectBannerLines(context);
    }

    return [];
}
