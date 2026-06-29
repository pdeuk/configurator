import type { ProjectArtworkAsset, ProjectDocument } from "../../models/ProjectModel";
import { assetService } from "../assets/AssetService";
import { getActiveCloudAssetStore } from "../cloud/cloudAssetBridge";

function triggerBrowserDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
}

async function resolveOriginalBlob(asset: ProjectArtworkAsset): Promise<Blob | null> {
    const localBlob = await assetService.getBlob(asset.id);

    if (localBlob) {
        return localBlob;
    }

    const cloudStore = getActiveCloudAssetStore();

    if (cloudStore) {
        const downloaded = await cloudStore.download(asset.id);

        if (downloaded) {
            return downloaded.blob;
        }
    }

    const publicUrl = asset.storage.publicUrl;

    if (publicUrl?.startsWith("http")) {
        const response = await fetch(publicUrl);

        if (response.ok) {
            return response.blob();
        }
    }

    return null;
}

export function getProjectArtworkAssets(document: ProjectDocument): ProjectArtworkAsset[] {
    return document.artworkAssets;
}

export async function downloadProjectArtworkAsset(asset: ProjectArtworkAsset): Promise<void> {
    const blob = await resolveOriginalBlob(asset);

    if (!blob) {
        throw new Error(
            `Unable to download "${asset.fileName}". The original file is not available on this device.`
        );
    }

    triggerBrowserDownload(blob, asset.fileName);
}

export async function downloadAllProjectArtwork(
    document: ProjectDocument
): Promise<{ downloaded: number; failed: string[] }> {
    const assets = getProjectArtworkAssets(document);
    const failed: string[] = [];
    let downloaded = 0;

    for (const asset of assets) {
        try {
            await downloadProjectArtworkAsset(asset);
            downloaded += 1;
            await new Promise(resolve => window.setTimeout(resolve, 300));
        } catch {
            failed.push(asset.fileName);
        }
    }

    if (downloaded === 0 && assets.length > 0) {
        throw new Error("No artwork files could be downloaded.");
    }

    return { downloaded, failed };
}
