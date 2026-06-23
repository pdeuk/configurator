import type { ArtworkFileType } from "../../models/ModuleModel";
import type { AssetDocument, AssetMetadata, AssetRecordSummary } from "./AssetDocument";
import { indexedDbAssetStore } from "./IndexedDbAssetStore";
import { createArtworkDisplayUrlFromFile, getArtworkFileTypeFromFile } from "../../utils/artwork";

const displayUrlCache = new Map<string, Promise<string>>();

export const MISSING_ARTWORK_DATA_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#3a3f47"/>
  <rect x="64" y="64" width="384" height="384" fill="#2d3440" stroke="#6b7280" stroke-width="8" stroke-dasharray="16 12"/>
  <text x="256" y="248" fill="#9aa3b2" font-family="sans-serif" font-size="24" text-anchor="middle">Artwork</text>
  <text x="256" y="284" fill="#9aa3b2" font-family="sans-serif" font-size="20" text-anchor="middle">Unavailable</text>
</svg>`)}`;

function toAssetSummary(asset: AssetDocument): AssetRecordSummary {
    const { blob: _blob, ...summary } = asset;
    return summary;
}

export class AssetService {
    async upload(
        file: File,
        metadata: Pick<AssetMetadata, "width" | "height" | "dpi">
    ): Promise<AssetDocument> {
        const type = getArtworkFileTypeFromFile(file);
        const asset: AssetDocument = {
            id: crypto.randomUUID(),
            filename: file.name,
            type,
            size: file.size,
            createdAt: new Date().toISOString(),
            width: metadata.width,
            height: metadata.height,
            dpi: metadata.dpi,
            blob: file
        };

        await indexedDbAssetStore.save(asset);
        displayUrlCache.delete(asset.id);

        return asset;
    }

    async uploadBlob(
        blob: Blob,
        metadata: AssetMetadata
    ): Promise<AssetDocument> {
        const asset: AssetDocument = {
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            blob,
            ...metadata
        };

        await indexedDbAssetStore.save(asset);
        displayUrlCache.delete(asset.id);

        return asset;
    }

    async getAsset(id: string): Promise<AssetDocument | null> {
        const asset = await indexedDbAssetStore.get(id);
        return asset ?? null;
    }

    async getBlob(id: string): Promise<Blob | null> {
        const asset = await this.getAsset(id);
        return asset?.blob ?? null;
    }

    async createObjectUrl(id: string): Promise<string | null> {
        const url = await this.resolveDisplayUrl(id);
        return url === MISSING_ARTWORK_DATA_URL ? null : url;
    }

    async resolveDisplayUrl(id: string): Promise<string> {
        if (!displayUrlCache.has(id)) {
            displayUrlCache.set(id, this.loadDisplayUrl(id));
        }

        return displayUrlCache.get(id)!;
    }

    clearDisplayUrlCache(id?: string) {
        if (id) {
            displayUrlCache.delete(id);
            return;
        }

        displayUrlCache.clear();
    }

    async deleteAsset(id: string): Promise<void> {
        displayUrlCache.delete(id);
        await indexedDbAssetStore.delete(id);
    }

    async listAssets(): Promise<AssetRecordSummary[]> {
        const assets = await indexedDbAssetStore.list();
        return assets
            .map(toAssetSummary)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    private async loadDisplayUrl(id: string): Promise<string> {
        const asset = await this.getAsset(id);

        if (!asset) {
            return MISSING_ARTWORK_DATA_URL;
        }

        if (asset.type === "png" || asset.type === "jpg") {
            return URL.createObjectURL(asset.blob);
        }

        const file = new File([asset.blob], asset.filename, {
            type: getMimeTypeForArtworkFileType(asset.type)
        });

        try {
            return await createArtworkDisplayUrlFromFile(file, asset.type);
        } catch (error) {
            console.warn(`Unable to decode asset "${id}" for display.`, error);
            return MISSING_ARTWORK_DATA_URL;
        }
    }
}

function getMimeTypeForArtworkFileType(type: ArtworkFileType): string {
    switch (type) {
        case "pdf":
            return "application/pdf";
        case "tiff":
            return "image/tiff";
        case "jpg":
            return "image/jpeg";
        case "png":
            return "image/png";
    }
}

export const assetService = new AssetService();
