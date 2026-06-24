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

function isShareExpired(expiresAt: string, now = Date.now()): boolean {
    return new Date(expiresAt).getTime() <= now;
}

export class ShareService {
    private readonly storage: ShareStorage;

    constructor(storage: ShareStorage = localShareStorage) {
        this.storage = storage;
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
            createdAt,
            expiresAt: options.expiresAt
                ?? new Date(Date.now() + DEFAULT_SHARE_TTL_MS).toISOString(),
            permissions: {
                view: options.permissions?.view ?? DEFAULT_SHARE_PERMISSIONS.view,
                duplicate: options.permissions?.duplicate
                    ?? DEFAULT_SHARE_PERMISSIONS.duplicate
            }
        };
        const record: SharedProjectRecord = {
            shared,
            projectSnapshot: projectDocument,
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
