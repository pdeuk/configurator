import type {
    ArtworkDpi,
    ArtworkInfo,
    FabricInfo,
    FabricSide,
    ModuleFabrics,
    RasterArtworkInfo,
    StandModule
} from "../models/ModuleModel";

export const METERS_PER_INCH = 0.0254;
export const CENTIMETERS_PER_METER = 100;

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

export const FABRIC_SIDES: FabricSide[] = ["front", "back"];

export function createDefaultFabrics(): ModuleFabrics {
    return {
        front: {
            isBlockout: false,
            isLuminous: false,
            artwork: null
        },
        back: {
            isBlockout: false,
            isLuminous: false,
            artwork: null
        }
    };
}

export function getModuleFabric(
    module: StandModule,
    side: FabricSide
): FabricInfo {
    return {
        ...createDefaultFabrics()[side],
        ...module.fabrics?.[side]
    };
}

export function setModuleFabric(
    module: StandModule,
    side: FabricSide,
    fabric: FabricInfo
): ModuleFabrics {
    return {
        ...createDefaultFabrics(),
        ...module.fabrics,
        [side]: fabric
    };
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
