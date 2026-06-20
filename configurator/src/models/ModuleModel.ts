export type ModuleType =
    | "wall"
    | "corner";

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
    fileName: string;
    fileType: ArtworkFileType;
    imageUrl: string;
    pixelWidth: number;
    pixelHeight: number;
    printWidthCm: number;
    printHeightCm: number;
    rasters: RasterArtworkInfo[];
}

export type FabricSide =
    | "front"
    | "back";

export interface FabricInfo {
    isBlockout: boolean;
    artwork?: ArtworkInfo | null;
}

export type ModuleFabrics = Record<FabricSide, FabricInfo>;

export interface StandModule {

    id:string;

    type:ModuleType;


    position:Position3;


    rotation:number;


    width:number;
    height:number;
    depth:number;


    snappedTo?:string | null;

    fabrics?: ModuleFabrics;

    artwork?: ArtworkInfo | null;

}
