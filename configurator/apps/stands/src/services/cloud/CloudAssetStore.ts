import type { ArtworkFileType } from "../../models/ModuleModel";
import type { AssetDocument } from "../assets/AssetDocument";
import { indexedDbAssetStore } from "../assets/IndexedDbAssetStore";
import { ARTWORK_STORAGE_BUCKET } from "./cloudTypes";
import { getSupabaseClient } from "@configurator/core/cloud";

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

function buildStoragePath(userId: string, assetId: string, filename: string): string {
    const safeName = filename.replace(/[^\w.-]+/g, "_");
    return `${userId}/${assetId}/${safeName}`;
}

export class CloudAssetStore {
    private readonly userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    async upload(asset: AssetDocument): Promise<AssetDocument> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const storagePath = buildStoragePath(this.userId, asset.id, asset.filename);
        const mimeType = getMimeTypeForArtworkFileType(asset.type);

        const { error: uploadError } = await client.storage
            .from(ARTWORK_STORAGE_BUCKET)
            .upload(storagePath, asset.blob, {
                upsert: true,
                contentType: mimeType
            });

        if (uploadError) {
            throw uploadError;
        }

        const { error: rowError } = await client
            .from("artwork_assets")
            .upsert({
                id: asset.id,
                user_id: this.userId,
                filename: asset.filename,
                mime_type: mimeType,
                storage_path: storagePath,
                metadata_json: {
                    type: asset.type,
                    size: asset.size,
                    width: asset.width,
                    height: asset.height,
                    dpi: asset.dpi,
                    createdAt: asset.createdAt
                },
                created_at: asset.createdAt
            });

        if (rowError) {
            throw rowError;
        }

        await indexedDbAssetStore.save(asset);

        return asset;
    }

    async download(assetId: string): Promise<AssetDocument | null> {
        const localAsset = await indexedDbAssetStore.get(assetId);

        if (localAsset) {
            return localAsset;
        }

        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data: row, error: rowError } = await client
            .from("artwork_assets")
            .select("*")
            .eq("id", assetId)
            .eq("user_id", this.userId)
            .maybeSingle();

        if (rowError) {
            throw rowError;
        }

        if (!row) {
            return null;
        }

        const { data: blob, error: downloadError } = await client.storage
            .from(ARTWORK_STORAGE_BUCKET)
            .download(row.storage_path);

        if (downloadError || !blob) {
            return null;
        }

        const metadata = row.metadata_json as {
            type: ArtworkFileType;
            size: number;
            width: number;
            height: number;
            dpi: number;
            createdAt: string;
        };

        const asset: AssetDocument = {
            id: row.id,
            filename: row.filename,
            type: metadata.type,
            size: metadata.size,
            width: metadata.width,
            height: metadata.height,
            dpi: metadata.dpi,
            createdAt: metadata.createdAt,
            blob
        };

        await indexedDbAssetStore.save(asset);

        return asset;
    }

    async delete(assetId: string): Promise<void> {
        const client = getSupabaseClient();

        if (client) {
            const { data: row } = await client
                .from("artwork_assets")
                .select("storage_path")
                .eq("id", assetId)
                .eq("user_id", this.userId)
                .maybeSingle();

            if (row?.storage_path) {
                await client.storage
                    .from(ARTWORK_STORAGE_BUCKET)
                    .remove([row.storage_path]);
            }

            await client
                .from("artwork_assets")
                .delete()
                .eq("id", assetId)
                .eq("user_id", this.userId);
        }

        await indexedDbAssetStore.delete(assetId);
    }

    async resolveUrl(assetId: string): Promise<string | null> {
        const asset = await this.download(assetId);

        if (!asset) {
            return null;
        }

        if (asset.type === "png" || asset.type === "jpg") {
            return URL.createObjectURL(asset.blob);
        }

        const client = getSupabaseClient();

        if (!client) {
            return URL.createObjectURL(asset.blob);
        }

        const { data: row } = await client
            .from("artwork_assets")
            .select("storage_path")
            .eq("id", assetId)
            .eq("user_id", this.userId)
            .maybeSingle();

        if (!row?.storage_path) {
            return URL.createObjectURL(asset.blob);
        }

        const { data, error } = await client.storage
            .from(ARTWORK_STORAGE_BUCKET)
            .createSignedUrl(row.storage_path, 60 * 60);

        if (error || !data?.signedUrl) {
            return URL.createObjectURL(asset.blob);
        }

        return data.signedUrl;
    }
}
