import type { AuthUser } from "@configurator/core/cloud";
import { assetService } from "../assets/AssetService";
import { CloudAssetStore } from "./CloudAssetStore";

let activeCloudAssetStore: CloudAssetStore | null = null;

export function setActiveCloudAssetStore(store: CloudAssetStore | null): void {
    activeCloudAssetStore = store;
}

export function getActiveCloudAssetStore(): CloudAssetStore | null {
    return activeCloudAssetStore;
}

export function createCloudAssetStoreForUser(user: AuthUser | null): CloudAssetStore | null {
    if (!user) {
        return null;
    }

    return new CloudAssetStore(user.id);
}

export async function resolveCloudAssetUrl(assetId: string): Promise<string | null> {
    if (!activeCloudAssetStore) {
        return null;
    }

    return activeCloudAssetStore.resolveUrl(assetId);
}

export async function syncAssetToCloudIfAvailable(
    assetId: string
): Promise<void> {
    if (!activeCloudAssetStore) {
        return;
    }

    const asset = await assetService.getAsset(assetId);

    if (!asset) {
        return;
    }

    try {
        await activeCloudAssetStore.upload(asset);
    } catch (error) {
        console.warn(`Cloud asset sync failed for "${assetId}".`, error);
    }
}

/**
 * Ensure an asset exists in cloud storage and return a signed URL valid for the
 * given lifetime. Used when creating a share link so the snapshot can carry
 * URLs that anonymous recipients can load.
 */
export async function createShareAssetSignedUrl(
    assetId: string,
    expiresInSeconds: number
): Promise<string | null> {
    if (!activeCloudAssetStore) {
        return null;
    }

    const asset = await assetService.getAsset(assetId);

    if (asset) {
        try {
            await activeCloudAssetStore.upload(asset);
        } catch (error) {
            console.warn(`Cloud asset upload before signing failed for "${assetId}".`, error);
        }
    }

    try {
        return await activeCloudAssetStore.createSignedUrl(assetId, expiresInSeconds);
    } catch (error) {
        console.warn(`Cloud asset signing failed for "${assetId}".`, error);
        return null;
    }
}
