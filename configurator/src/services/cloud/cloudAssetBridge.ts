import type { AuthUser } from "./CloudAuthService";
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
