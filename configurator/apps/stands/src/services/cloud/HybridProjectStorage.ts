import type { ProjectDocument, ProjectListItem } from "../../models/ProjectModel";
import type { StorageService } from "../StorageService";
import { localProjectStorage } from "../StorageService";
import type { AuthUser } from "@configurator/core/cloud";
import { CloudProjectStorage } from "./CloudProjectStorage";
import {
    isBrowserOnline,
    isSupabaseConfigured,
    setCloudSyncStatus
} from "@configurator/core/cloud";

export interface CloudStorageContext {
    user: AuthUser | null;
}

let storageContext: CloudStorageContext = { user: null };

export function setCloudStorageContext(context: CloudStorageContext): void {
    storageContext = context;
}

export function getCloudStorageContext(): CloudStorageContext {
    return storageContext;
}

function canUseCloudStorage(): boolean {
    return Boolean(
        isSupabaseConfigured() &&
        storageContext.user &&
        isBrowserOnline()
    );
}

function getCloudStorage(): CloudProjectStorage | null {
    if (!storageContext.user) {
        return null;
    }

    return new CloudProjectStorage(storageContext.user.id);
}

export class HybridProjectStorage implements StorageService {
    loadProjectSync(projectId: string): ProjectDocument | null {
        return localProjectStorage.loadProjectSync(projectId);
    }

    saveProjectSync(project: ProjectDocument): void {
        localProjectStorage.saveProjectSync(project);
    }

    async loadProject(projectId: string): Promise<ProjectDocument | null> {
        const cloud = getCloudStorage();

        if (canUseCloudStorage() && cloud) {
            try {
                const cloudDocument = await cloud.loadProject(projectId);

                if (cloudDocument) {
                    await localProjectStorage.saveProject(cloudDocument);
                    setCloudSyncStatus("synced");
                    return cloudDocument;
                }
            } catch (error) {
                console.warn("Cloud project load failed; using local copy.", error);
                setCloudSyncStatus(isBrowserOnline() ? "error" : "offline");
            }
        }

        return localProjectStorage.loadProject(projectId);
    }

    async saveProject(project: ProjectDocument): Promise<void> {
        await localProjectStorage.saveProject(project);

        const cloud = getCloudStorage();

        if (!canUseCloudStorage() || !cloud) {
            setCloudSyncStatus(storageContext.user ? "offline" : "local");
            return;
        }

        setCloudSyncStatus("syncing");

        try {
            await cloud.saveProject(project);
            setCloudSyncStatus("synced");
        } catch (error) {
            console.warn("Cloud project save failed; kept local copy.", error);
            setCloudSyncStatus(isBrowserOnline() ? "error" : "offline");
        }
    }

    async deleteProject(projectId: string): Promise<void> {
        await localProjectStorage.deleteProject(projectId);

        const cloud = getCloudStorage();

        if (canUseCloudStorage() && cloud) {
            try {
                await cloud.deleteProject(projectId);
            } catch (error) {
                console.warn("Cloud project delete failed.", error);
            }
        }
    }

    async listProjects(): Promise<ProjectDocument[]> {
        const localProjects = await localProjectStorage.listProjects();
        const cloud = getCloudStorage();

        if (!canUseCloudStorage() || !cloud) {
            return localProjects;
        }

        try {
            const cloudProjects = await cloud.listProjects();
            const merged = new Map<string, ProjectDocument>();

            for (const project of localProjects) {
                merged.set(project.id, project);
            }

            for (const project of cloudProjects) {
                const existing = merged.get(project.id);

                if (!existing || project.updatedAt >= existing.updatedAt) {
                    merged.set(project.id, project);
                    await localProjectStorage.saveProject(project);
                }
            }

            setCloudSyncStatus("synced");

            return [...merged.values()].sort((left, right) =>
                right.updatedAt.localeCompare(left.updatedAt)
            );
        } catch (error) {
            console.warn("Cloud project list failed; using local projects.", error);
            setCloudSyncStatus(isBrowserOnline() ? "error" : "offline");
            return localProjects;
        }
    }

    async listProjectSummaries(): Promise<ProjectListItem[]> {
        const localProjects = await localProjectStorage.listProjectSummaries();
        const cloud = getCloudStorage();

        if (!canUseCloudStorage() || !cloud) {
            return localProjects;
        }

        try {
            const cloudProjects = await cloud.listProjectSummaries();
            const merged = new Map<string, ProjectListItem>();

            for (const project of localProjects) {
                merged.set(project.id, project);
            }

            for (const project of cloudProjects) {
                const existing = merged.get(project.id);

                if (!existing || project.updatedAt >= existing.updatedAt) {
                    merged.set(project.id, project);
                }
            }

            setCloudSyncStatus("synced");

            return [...merged.values()].sort((left, right) =>
                right.updatedAt.localeCompare(left.updatedAt)
            );
        } catch (error) {
            console.warn("Cloud project summary list failed; using local projects.", error);
            setCloudSyncStatus(isBrowserOnline() ? "error" : "offline");
            return localProjects;
        }
    }
}

export const hybridProjectStorage = new HybridProjectStorage();

export function getProjectStorage(): StorageService {
    return hybridProjectStorage;
}
