import type { ArtworkFileType } from "../../models/ModuleModel";

export interface AssetDocument {
    id: string;
    filename: string;
    type: ArtworkFileType;
    size: number;
    createdAt: string;
    width: number;
    height: number;
    dpi: number;
    blob: Blob;
}

export type AssetMetadata = Omit<AssetDocument, "id" | "createdAt" | "blob">;

export type AssetRecordSummary = Omit<AssetDocument, "blob">;
