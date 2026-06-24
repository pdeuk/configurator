import type { ProjectDocument } from "../../models/ProjectModel";

export interface ProjectRevision {
    id: string;
    projectId: ProjectDocument["id"];
    versionNumber: number;
    createdAt: string;
    createdBy: string;
    message: string;
    snapshot: ProjectDocument;
}

export interface CreateRevisionInput {
    project: ProjectDocument;
    message: string;
    createdBy?: string;
}

export interface RevisionComparison {
    revisionAId: string;
    revisionBId: string;
    versionA: number;
    versionB: number;
    summaryLines: string[];
    moduleCountA: number;
    moduleCountB: number;
    addedModuleIds: string[];
    removedModuleIds: string[];
    changedModuleIds: string[];
}

/** Reserved for audit trail integrations. */
export interface RevisionAuditEntry {
    revisionId: string;
    projectId: string;
    action: "created" | "restored" | "compared";
    actorId: string;
    recordedAt: string;
}

/** Reserved for customer approval linkage. */
export interface RevisionApprovalRef {
    revisionId: string;
    reviewStatus: string | null;
    approvedAt: string | null;
}

/** Reserved for manufacturing history exports. */
export interface RevisionManufacturingRef {
    revisionId: string;
    versionNumber: number;
    exportedAt: string | null;
    workOrderId: string | null;
}

export function formatRevisionLabel(revision: Pick<ProjectRevision, "versionNumber" | "message">): string {
    const label = revision.message.trim();

    if (label) {
        return `v${revision.versionNumber} · ${label}`;
    }

    return `v${revision.versionNumber}`;
}

export function formatRevisionDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(undefined, {
        month: "long",
        day: "numeric",
        year: "numeric"
    });
}
