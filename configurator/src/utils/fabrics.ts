import type {
    ArtworkInfo,
    FabricInfo,
    FabricSide,
    ModuleFabrics,
    StandModule
} from "../models/ModuleModel";

const METERS_PER_INCH = 0.0254;

export const FABRIC_SIDES: FabricSide[] = ["front", "back"];

export function createDefaultFabrics(): ModuleFabrics {
    return {
        front: {
            isBlockout: false,
            artwork: null
        },
        back: {
            isBlockout: false,
            artwork: null
        }
    };
}

export function getModuleFabric(
    module: StandModule,
    side: FabricSide
): FabricInfo {
    return module.fabrics?.[side] ?? createDefaultFabrics()[side];
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

export function recalculateArtworkDpi(
    artwork: ArtworkInfo,
    fabricWidthMeters: number,
    fabricHeightMeters: number
): ArtworkInfo {
    const fabricWidthInches = fabricWidthMeters / METERS_PER_INCH;
    const fabricHeightInches = fabricHeightMeters / METERS_PER_INCH;
    const dpiX = artwork.pixelWidth / fabricWidthInches;
    const dpiY = artwork.pixelHeight / fabricHeightInches;

    return {
        ...artwork,
        dpiX,
        dpiY,
        effectiveDpi: Math.min(dpiX, dpiY)
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

    return {
        isBlockout: anyBlockout,
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
