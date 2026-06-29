import type { ProjectDocument } from "../../models/ProjectModel";
import type {
    CreateShareLinkOptions,
    SharedProject,
    SharedProjectLoadResult,
    SharedProjectRecord
} from "./ShareModel";
import {
    DEFAULT_SHARE_PERMISSIONS,
    DEFAULT_SHARE_TTL_MS
} from "./ShareModel";
import { localShareStorage, type ShareStorage } from "./ShareStorage";
import { SupabaseShareStorage } from "./SupabaseShareStorage";
import { isSupabaseConfigured } from "@configurator/core/cloud";
import { createShareAssetSignedUrl } from "../cloud";

const MIN_SHARE_ASSET_URL_TTL_SECONDS = 60;

function isShareExpired(expiresAt: string, now = Date.now()): boolean {
    const timestamp = new Date(expiresAt).getTime();

    if (Number.isNaN(timestamp)) {
        return false;
    }

    return timestamp <= now;
}

/**
 * Bake signed, share-scoped image URLs into the snapshot so anonymous recipients
 * (or other devices) can load artwork that otherwise only lives in the creator's
 * browser/owner-scoped cloud storage. URLs expire with the share link.
 */
async function enrichSnapshotWithShareAssetUrls(
    projectDocument: ProjectDocument,
    expiresAt: string
): Promise<ProjectDocument> {
    if (!isSupabaseConfigured() || projectDocument.artworkAssets.length === 0) {
        return projectDocument;
    }

    const expiresInSeconds = Math.max(
        MIN_SHARE_ASSET_URL_TTL_SECONDS,
        Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
    );

    if (!Number.isFinite(expiresInSeconds)) {
        return projectDocument;
    }

    const artworkAssets = await Promise.all(
        projectDocument.artworkAssets.map(async asset => {
            if (asset.storage.publicUrl) {
                return asset;
            }

            const signedUrl = await createShareAssetSignedUrl(asset.id, expiresInSeconds);

            if (!signedUrl) {
                return asset;
            }

            return {
                ...asset,
                storage: {
                    ...asset.storage,
                    publicUrl: signedUrl
                }
            };
        })
    );

    return {
        ...projectDocument,
        artworkAssets
    };
}

/**
 * Use cloud storage whenever Supabase is configured so links resolve on other
 * devices. Reading a share works anonymously; creating one requires sign-in.
 */
function resolveDefaultStorage(): ShareStorage {
    return isSupabaseConfigured() ? new SupabaseShareStorage() : localShareStorage;
}

export class ShareService {
    private readonly storageOverride: ShareStorage | null;

    constructor(storage?: ShareStorage) {
        this.storageOverride = storage ?? null;
    }

    private get storage(): ShareStorage {
        return this.storageOverride ?? resolveDefaultStorage();
    }

    async createShareLink(
        projectDocument: ProjectDocument,
        options: CreateShareLinkOptions = {}
    ): Promise<SharedProject> {
        const createdAt = new Date().toISOString();
        const shared: SharedProject = {
            id: crypto.randomUUID(),
            projectId: projectDocument.id,
            shareToken: crypto.randomUUID(),
            shareKind: options.shareKind ?? "customer_review",
            createdAt,
            expiresAt: options.expiresAt
                ?? new Date(Date.now() + DEFAULT_SHARE_TTL_MS).toISOString(),
            permissions: {
                view: options.permissions?.view ?? DEFAULT_SHARE_PERMISSIONS.view,
                duplicate: options.permissions?.duplicate
                    ?? DEFAULT_SHARE_PERMISSIONS.duplicate
            }
        };
        const projectSnapshot = await enrichSnapshotWithShareAssetUrls(
            projectDocument,
            shared.expiresAt
        );
        const record: SharedProjectRecord = {
            shared,
            projectSnapshot,
            disabled: false
        };

        await this.storage.saveShare(record);

        return shared;
    }

    async loadSharedProject(shareToken: string): Promise<SharedProjectLoadResult | null> {
        const record = await this.storage.getByToken(shareToken);

        if (!record || record.disabled) {
            return null;
        }

        if (isShareExpired(record.shared.expiresAt)) {
            return null;
        }

        if (!record.shared.permissions.view) {
            return null;
        }

        return {
            shared: record.shared,
            project: record.projectSnapshot
        };
    }

    async disableShareLink(shareToken: string): Promise<boolean> {
        return this.storage.disableShare(shareToken);
    }
}

export const shareService = new ShareService();

export function createShareLink(
    projectDocument: ProjectDocument,
    options?: CreateShareLinkOptions
): Promise<SharedProject> {
    return shareService.createShareLink(projectDocument, options);
}

export function loadSharedProject(
    shareToken: string
): Promise<SharedProjectLoadResult | null> {
    return shareService.loadSharedProject(shareToken);
}

export function disableShareLink(shareToken: string): Promise<boolean> {
    return shareService.disableShareLink(shareToken);
}
