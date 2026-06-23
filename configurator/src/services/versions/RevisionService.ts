import type { ProjectDocument } from "../../models/ProjectModel";
import { normalizeProjectDocument } from "../../lib/projectSerialization";
import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { isSupabaseConfigured } from "../cloud/SupabaseClient";
import { isBrowserOnline } from "../cloud/syncStatus";
import { compareRevisionSnapshots } from "./revisionCompare";
import {
    localRevisionStorage,
    type RevisionStorage
} from "./RevisionStorage";
import { SupabaseRevisionStorage } from "./SupabaseRevisionStorage";
import type {
    ProjectRevision,
    RevisionAuditEntry,
    RevisionComparison
} from "./VersionModel";

function canUseCloudRevisions(): boolean {
    const { user } = getCloudStorageContext();
    return Boolean(isSupabaseConfigured() && user && isBrowserOnline());
}

function getRevisionStorage(): RevisionStorage {
    if (canUseCloudRevisions()) {
        return new SupabaseRevisionStorage();
    }

    return localRevisionStorage;
}

function resolveCreatedBy(createdBy?: string): string {
    if (createdBy?.trim()) {
        return createdBy.trim();
    }

    const { user } = getCloudStorageContext();
    return user?.email ?? user?.id ?? "local";
}

/** Reserved for audit trail hooks. */
function recordRevisionAudit(_entry: RevisionAuditEntry): void {
    // Intentionally empty — wired later for audit trail.
}

export class RevisionService {
    async createRevision(
        project: ProjectDocument,
        message: string,
        createdBy?: string
    ): Promise<ProjectRevision> {
        const author = resolveCreatedBy(createdBy);
        const revision = await getRevisionStorage().createRevision(
            project,
            message,
            author
        );

        recordRevisionAudit({
            revisionId: revision.id,
            projectId: revision.projectId,
            action: "created",
            actorId: author,
            recordedAt: revision.createdAt
        });

        return revision;
    }

    async getRevisions(projectId: string): Promise<ProjectRevision[]> {
        const cloudRevisions = canUseCloudRevisions()
            ? await new SupabaseRevisionStorage().getRevisions(projectId)
            : [];

        if (cloudRevisions.length > 0) {
            return cloudRevisions;
        }

        return localRevisionStorage.getRevisions(projectId);
    }

    async getRevision(revisionId: string): Promise<ProjectRevision | null> {
        const cloudRevision = canUseCloudRevisions()
            ? await new SupabaseRevisionStorage().getRevision(revisionId)
            : null;

        if (cloudRevision) {
            return cloudRevision;
        }

        return localRevisionStorage.getRevision(revisionId);
    }

    async restoreRevision(revisionId: string): Promise<ProjectDocument> {
        const revision = await this.getRevision(revisionId);

        if (!revision) {
            throw new Error(`Revision "${revisionId}" was not found.`);
        }

        const normalized = normalizeProjectDocument(revision.snapshot);

        if (!normalized) {
            throw new Error(`Revision "${revisionId}" snapshot is invalid.`);
        }

        recordRevisionAudit({
            revisionId: revision.id,
            projectId: revision.projectId,
            action: "restored",
            actorId: resolveCreatedBy(),
            recordedAt: new Date().toISOString()
        });

        return normalized;
    }

    async compareRevisions(
        revisionIdA: string,
        revisionIdB: string
    ): Promise<RevisionComparison> {
        const [revisionA, revisionB] = await Promise.all([
            this.getRevision(revisionIdA),
            this.getRevision(revisionIdB)
        ]);

        if (!revisionA) {
            throw new Error(`Revision "${revisionIdA}" was not found.`);
        }

        if (!revisionB) {
            throw new Error(`Revision "${revisionIdB}" was not found.`);
        }

        const comparison = compareRevisionSnapshots(
            revisionA.id,
            revisionB.id,
            revisionA.versionNumber,
            revisionB.versionNumber,
            revisionA.snapshot,
            revisionB.snapshot
        );

        recordRevisionAudit({
            revisionId: revisionA.id,
            projectId: revisionA.projectId,
            action: "compared",
            actorId: resolveCreatedBy(),
            recordedAt: new Date().toISOString()
        });

        return comparison;
    }
}

export const revisionService = new RevisionService();

export function createRevision(
    project: ProjectDocument,
    message: string,
    createdBy?: string
): Promise<ProjectRevision> {
    return revisionService.createRevision(project, message, createdBy);
}

export function getRevisions(projectId: string): Promise<ProjectRevision[]> {
    return revisionService.getRevisions(projectId);
}

export function restoreRevision(revisionId: string): Promise<ProjectDocument> {
    return revisionService.restoreRevision(revisionId);
}

export function compareRevisions(
    revisionIdA: string,
    revisionIdB: string
): Promise<RevisionComparison> {
    return revisionService.compareRevisions(revisionIdA, revisionIdB);
}
