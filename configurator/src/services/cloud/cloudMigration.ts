import type { ProjectDocument } from "../../models/ProjectModel";
import { assetService } from "../assets/AssetService";
import { localProjectStorage } from "../StorageService";
import type { AuthUser } from "./CloudAuthService";
import { CloudAssetStore } from "./CloudAssetStore";
import { CloudProjectStorage } from "./CloudProjectStorage";
import { isSupabaseConfigured } from "./SupabaseClient";
import { setCloudSyncStatus } from "./syncStatus";

function collectArtworkAssetIds(project: ProjectDocument): string[] {
    const assetIds = new Set<string>();

    for (const asset of project.artworkAssets) {
        assetIds.add(asset.id);
    }

    for (const assignment of project.artworkAssignments) {
        assetIds.add(assignment.artworkAssetId);
    }

    return [...assetIds];
}

export interface ImportProjectsToCloudResult {
    importedProjects: number;
    importedAssets: number;
    skippedProjects: number;
}

export async function importLocalProjectsToCloud(
    user: AuthUser
): Promise<ImportProjectsToCloudResult> {
    if (!isSupabaseConfigured()) {
        throw new Error("Supabase is not configured.");
    }

    setCloudSyncStatus("syncing");

    const cloudProjects = new CloudProjectStorage(user.id);
    const cloudAssets = new CloudAssetStore(user.id);
    const localProjects = await localProjectStorage.listProjects();
    let importedProjects = 0;
    let importedAssets = 0;
    let skippedProjects = 0;

    for (const project of localProjects) {
        try {
            await cloudProjects.saveProject(project);
            importedProjects += 1;

            for (const assetId of collectArtworkAssetIds(project)) {
                const asset = await assetService.getAsset(assetId);

                if (!asset) {
                    continue;
                }

                await cloudAssets.upload(asset);
                importedAssets += 1;
            }
        } catch (error) {
            console.warn(`Cloud import failed for project "${project.id}".`, error);
            skippedProjects += 1;
        }
    }

    setCloudSyncStatus("synced");

    return {
        importedProjects,
        importedAssets,
        skippedProjects
    };
}
