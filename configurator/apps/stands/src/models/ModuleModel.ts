export type ModuleType =
    | "wall"
    | "cube"
    | "promoStand"
    | "corner"
    | "circularBanner"
    | "squareBanner"
    | "exhibitionWall";

export function isHangingBannerType(type: ModuleType): boolean {
    return type === "circularBanner" || type === "squareBanner";
}

export function isExhibitionWallType(type: ModuleType): boolean {
    return type === "exhibitionWall";
}

export function usesSegmentedFabricSides(type: ModuleType): boolean {
    return isHangingBannerType(type) || isExhibitionWallType(type);
}

export function isPromoStandType(type: ModuleType): boolean {
    return type === "promoStand";
}

export function isBoxLikeModuleType(type: ModuleType): boolean {
    return type === "cube" || type === "promoStand";
}

export interface Position3 {
    x: number;
    y: number;
    z: number;
}

export type ArtworkFileType =
    | "pdf"
    | "tiff"
    | "jpg"
    | "png";

export interface ArtworkDpi {
    dpiX: number;
    dpiY: number;
    effectiveDpi: number;
}

export interface RasterArtworkInfo extends ArtworkDpi {
    label: string;
    pixelWidth: number;
    pixelHeight: number;
    printWidthCm: number;
    printHeightCm: number;
    fabricWidthRatio: number;
    fabricHeightRatio: number;
}

export interface ArtworkInfo extends ArtworkDpi {
    /** Persistent artwork reference in IndexedDB. */
    assetId?: string;
    fileName: string;
    fileType: ArtworkFileType;
    imageUrl: string;
    pixelWidth: number;
    pixelHeight: number;
    printWidthCm: number;
    printHeightCm: number;
    rasters: RasterArtworkInfo[];
    /** Unedited upload kept for re-editing and reset-to-original. */
    sourceArtwork?: ArtworkSourceSnapshot;
}

export type ArtworkSourceSnapshot = Omit<ArtworkInfo, "sourceArtwork">;

export type FrameFabricSide =
    | "front"
    | "back";

export type CubeFabricSide =
    | "front"
    | "back"
    | "left"
    | "right"
    | "top";

export type PromoStandFabricSide =
    | "front"
    | "left"
    | "right"
    | "inside";

export type BannerFabricLayer = "outside" | "inside";

export type BannerFabricSide =
    | `outside-${number}`
    | `inside-${number}`;

export type BoothDoorWallFabricSide = "top";

export type FabricSide =
    | FrameFabricSide
    | CubeFabricSide
    | PromoStandFabricSide
    | BannerFabricSide
    | BoothDoorWallFabricSide;

export type WallLayout = "standard" | "boothDoor";

export function isBoothDoorWall(
    module: Pick<StandModule, "type" | "wallLayout">
): boolean {
    return module.type === "wall" && module.wallLayout === "boothDoor";
}

export interface FabricInfo {
    isBlockout: boolean;
    isLuminous: boolean;
    artwork?: ArtworkInfo | null;
}

export type ModuleFabrics = Partial<Record<FabricSide, FabricInfo>>;

export interface StandModule {
    id: string;
    type: ModuleType;
    position: Position3;
    rotation: number;
    width: number;
    height: number;
    depth: number;
    segmentCount?: number;
    hasMelamineTop?: boolean;
    wallLayout?: WallLayout;
    snappedTo?: string | null;
    fabrics?: ModuleFabrics;
    artwork?: ArtworkInfo | null;
}

export interface FabricDimensions {
    width: number;
    height: number;
}
