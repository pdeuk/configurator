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

export interface ArtworkInfo {
    fileName: string;
    fileType: ArtworkFileType;
    imageUrl: string;
    pixelWidth: number;
    pixelHeight: number;
    dpiX: number;
    dpiY: number;
    effectiveDpi: number;
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
