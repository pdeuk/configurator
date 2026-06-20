import type {
    ArtworkDpi,
    ArtworkInfo,
    FabricDimensions,
    FabricInfo,
    FabricSide,
    ModuleFabrics,
    ModuleType,
    RasterArtworkInfo,
    StandModule
} from "../models/ModuleModel";

export const METERS_PER_INCH = 0.0254;
export const CENTIMETERS_PER_METER = 100;

export const FRAME_FABRIC_SIDES = ["front", "back"] as const;
export const CUBE_FABRIC_SIDES = ["front", "back", "left", "right", "top"] as const;

export const FABRIC_SIDES: FabricSide[] = [...FRAME_FABRIC_SIDES];

/** One in-app dimension unit equals one meter (100 cm) in real life. */
export function appUnitsToMeters(units: number): number {
    return units;
}

export function metersToCentimeters(meters: number): number {
    return meters * CENTIMETERS_PER_METER;
}

export function metersToInches(meters: number): number {
    return meters / METERS_PER_INCH;
}

export function getRailThickness(
    module: Pick<StandModule, "type" | "width" | "height" | "depth">
): number {
    if (module.type === "cube") {
        return Math.min(
            0.05,
            module.width * 0.08,
            module.height * 0.08,
            module.depth * 0.08
        );
    }

    return Math.min(
        0.14,
        module.width / 2,
        module.height / 2
    );
}

export function getFabricSidesForModule(module: StandModule): FabricSide[] {
    return module.type === "cube"
        ? [...CUBE_FABRIC_SIDES]
        : [...FRAME_FABRIC_SIDES];
}

export function isFabricSideValidForModule(
    module: StandModule,
    side: FabricSide
): boolean {
    return getFabricSidesForModule(module).includes(side);
}

function createDefaultFabricInfo(): FabricInfo {
    return {
        isBlockout: false,
        isLuminous: false,
        artwork: null
    };
}

export function createDefaultFabrics(moduleType: ModuleType = "wall"): ModuleFabrics {
    const sides = moduleType === "cube" ? CUBE_FABRIC_SIDES : FRAME_FABRIC_SIDES;

    return Object.fromEntries(
        sides.map(side => [side, createDefaultFabricInfo()])
    );
}

export function calculateArtworkDpi(
    pixelWidth: number,
    pixelHeight: number,
    printWidthMeters: number,
    printHeightMeters: number
): ArtworkDpi {
    const printWidthInches = metersToInches(printWidthMeters);
    const printHeightInches = metersToInches(printHeightMeters);
    const dpiX = printWidthInches > 0 ? pixelWidth / printWidthInches : 0;
    const dpiY = printHeightInches > 0 ? pixelHeight / printHeightInches : 0;

    return {
        dpiX,
        dpiY,
        effectiveDpi: Math.min(dpiX, dpiY)
    };
}

export interface RasterCoverageInput {
    label: string;
    pixelWidth: number;
    pixelHeight: number;
    fabricWidthRatio: number;
    fabricHeightRatio: number;
}

export function getModuleFabric(
    module: StandModule,
    side: FabricSide
): FabricInfo {
    return {
        ...createDefaultFabricInfo(),
        ...module.fabrics?.[side]
    };
}

export function setModuleFabric(
    module: StandModule,
    side: FabricSide,
    fabric: FabricInfo
): ModuleFabrics {
    return {
        ...createDefaultFabrics(module.type),
        ...module.fabrics,
        [side]: fabric
    };
}

export function getFabricDimensions(
    module: StandModule,
    side: FabricSide
): FabricDimensions {
    if (module.type === "cube") {
        switch (side) {
            case "front":
            case "back":
                return {
                    width: module.width,
                    height: module.height
                };
            case "left":
            case "right":
                return {
                    width: module.depth,
                    height: module.height
                };
            case "top":
                return {
                    width: module.width,
                    height: module.depth
                };
        }
    }

    switch (side) {
        case "front":
        case "back":
            return {
                width: module.width,
                height: module.height
            };
        case "left":
        case "right":
            return {
                width: module.depth,
                height: module.height
            };
        case "top":
            return {
                width: module.width,
                height: module.depth
            };
        default:
            return {
                width: module.width,
                height: module.height
            };
    }
}

function buildRasterArtworkInfo(
    raster: RasterCoverageInput,
    fabricWidthMeters: number,
    fabricHeightMeters: number
): RasterArtworkInfo {
    const printWidthMeters = fabricWidthMeters * raster.fabricWidthRatio;
    const printHeightMeters = fabricHeightMeters * raster.fabricHeightRatio;
    const dpi = calculateArtworkDpi(
        raster.pixelWidth,
        raster.pixelHeight,
        printWidthMeters,
        printHeightMeters
    );

    return {
        label: raster.label,
        pixelWidth: raster.pixelWidth,
        pixelHeight: raster.pixelHeight,
        printWidthCm: metersToCentimeters(printWidthMeters),
        printHeightCm: metersToCentimeters(printHeightMeters),
        fabricWidthRatio: raster.fabricWidthRatio,
        fabricHeightRatio: raster.fabricHeightRatio,
        ...dpi
    };
}

export function recalculateArtworkDpi(
    artwork: ArtworkInfo,
    fabricWidthMeters: number,
    fabricHeightMeters: number
): ArtworkInfo {
    const printWidthMeters = appUnitsToMeters(fabricWidthMeters);
    const printHeightMeters = appUnitsToMeters(fabricHeightMeters);
    const wholeFileDpi = calculateArtworkDpi(
        artwork.pixelWidth,
        artwork.pixelHeight,
        printWidthMeters,
        printHeightMeters
    );

    return {
        ...artwork,
        printWidthCm: metersToCentimeters(printWidthMeters),
        printHeightCm: metersToCentimeters(printHeightMeters),
        ...wholeFileDpi,
        rasters: artwork.rasters.map(raster =>
            buildRasterArtworkInfo(
                {
                    label: raster.label,
                    pixelWidth: raster.pixelWidth,
                    pixelHeight: raster.pixelHeight,
                    fabricWidthRatio: raster.fabricWidthRatio,
                    fabricHeightRatio: raster.fabricHeightRatio
                },
                fabricWidthMeters,
                fabricHeightMeters
            )
        )
    };
}

export function getMergedFabric(
    side: FabricSide,
    members: StandModule[]
): FabricInfo {
    const fabricWithArtwork = members
        .map(member => getModuleFabric(member, side))
        .find(fabric => fabric.artwork);
    const anyBlockout = members.some(member => getModuleFabric(member, side).isBlockout);
    const anyLuminous = members.some(member => getModuleFabric(member, side).isLuminous);

    return {
        isBlockout: anyBlockout,
        isLuminous: !anyBlockout && anyLuminous,
        artwork: fabricWithArtwork?.artwork ?? null
    };
}

export function getMergedFabricArtwork(
    side: FabricSide,
    module: StandModule,
    members: StandModule[],
    mergedWidth: number
): ArtworkInfo | null {
    const artwork = getMergedFabric(side, members).artwork;

    if (!artwork) {
        return null;
    }

    return recalculateArtworkDpi(artwork, mergedWidth, module.height);
}

export function getModuleFabricArtwork(
    module: StandModule,
    side: FabricSide
): ArtworkInfo | null {
    const fabric = getModuleFabric(module, side);

    if (!fabric.artwork) {
        return null;
    }

    const dimensions = getFabricDimensions(module, side);

    return recalculateArtworkDpi(
        fabric.artwork,
        dimensions.width,
        dimensions.height
    );
}

export function getActiveFabricArtwork(
    module: StandModule,
    side: FabricSide,
    members: StandModule[],
    mergedWidth: number
): ArtworkInfo | null {
    if (module.type === "cube") {
        return getModuleFabricArtwork(module, side);
    }

    return getMergedFabricArtwork(side, module, members, mergedWidth);
}

export function getActiveFabricPrintDimensions(
    module: StandModule,
    side: FabricSide,
    mergedWidth: number
): FabricDimensions {
    if (module.type === "cube") {
        return getFabricDimensions(module, side);
    }

    return {
        width: mergedWidth,
        height: module.height
    };
}

export function buildArtworkInfo(
    base: Omit<
        ArtworkInfo,
        "dpiX" | "dpiY" | "effectiveDpi" | "printWidthCm" | "printHeightCm" | "rasters"
    > & {
        rasters: RasterCoverageInput[];
    },
    fabricWidthMeters: number,
    fabricHeightMeters: number
): ArtworkInfo {
    const printWidthMeters = appUnitsToMeters(fabricWidthMeters);
    const printHeightMeters = appUnitsToMeters(fabricHeightMeters);
    const rasters = base.rasters.map(raster =>
        buildRasterArtworkInfo(raster, fabricWidthMeters, fabricHeightMeters)
    );
    const wholeFileDpi = calculateArtworkDpi(
        base.pixelWidth,
        base.pixelHeight,
        printWidthMeters,
        printHeightMeters
    );

    return {
        fileName: base.fileName,
        fileType: base.fileType,
        imageUrl: base.imageUrl,
        pixelWidth: base.pixelWidth,
        pixelHeight: base.pixelHeight,
        printWidthCm: metersToCentimeters(printWidthMeters),
        printHeightCm: metersToCentimeters(printHeightMeters),
        rasters,
        ...wholeFileDpi
    };
}

export function recalculateModuleFabrics(
    module: StandModule,
    _members: StandModule[],
    mergedWidth: number
): ModuleFabrics {
    if (module.type === "cube") {
        return Object.fromEntries(
            CUBE_FABRIC_SIDES.map(side => {
                const fabric = getModuleFabric(module, side);
                const dimensions = getFabricDimensions(module, side);

                return [
                    side,
                    {
                        ...fabric,
                        artwork: fabric.artwork
                            ? recalculateArtworkDpi(
                                fabric.artwork,
                                dimensions.width,
                                dimensions.height
                            )
                            : null
                    }
                ];
            })
        );
    }

    return {
        front: {
            ...getModuleFabric(module, "front"),
            artwork: getModuleFabric(module, "front").artwork
                ? recalculateArtworkDpi(
                    getModuleFabric(module, "front").artwork!,
                    mergedWidth,
                    module.height
                )
                : null
        },
        back: {
            ...getModuleFabric(module, "back"),
            artwork: getModuleFabric(module, "back").artwork
                ? recalculateArtworkDpi(
                    getModuleFabric(module, "back").artwork!,
                    mergedWidth,
                    module.height
                )
                : null
        }
    };
}
