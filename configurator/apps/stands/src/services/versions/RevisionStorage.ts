import type { ProjectDocument } from "../../models/ProjectModel";
import type { ProjectRevision } from "./VersionModel";

export interface RevisionStorage {
    createRevision(
        project: ProjectDocument,
        message: string,
        createdBy: string
    ): Promise<ProjectRevision>;
    getRevisions(projectId: string): Promise<ProjectRevision[]>;
    getRevision(revisionId: string): Promise<ProjectRevision | null>;
}

const REVISION_PREFIX = "configurator:revision:";
const REVISION_INDEX_KEY = "configurator:revision:index";

interface StoredRevisionRecord {
    revision: ProjectRevision;
}

function revisionKey(revisionId: string): string {
    return `${REVISION_PREFIX}${revisionId}`;
}

function readIndex(): StoredRevisionRecord[] {
    const raw = localStorage.getItem(REVISION_INDEX_KEY);

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as StoredRevisionRecord[];
    } catch {
        return [];
    }
}

function writeIndex(records: StoredRevisionRecord[]): void {
    localStorage.setItem(REVISION_INDEX_KEY, JSON.stringify(records));
}

function upsertRecord(record: StoredRevisionRecord): void {
    const records = readIndex().filter(entry => entry.revision.id !== record.revision.id);
    records.push(record);
    writeIndex(records);
    localStorage.setItem(revisionKey(record.revision.id), JSON.stringify(record));
}

function readRecord(revisionId: string): StoredRevisionRecord | null {
    const raw = localStorage.getItem(revisionKey(revisionId));

    if (raw) {
        try {
            return JSON.parse(raw) as StoredRevisionRecord;
        } catch {
            return null;
        }
    }

    return readIndex().find(entry => entry.revision.id === revisionId) ?? null;
}

function cloneProjectDocument(project: ProjectDocument): ProjectDocument {
    return JSON.parse(JSON.stringify(project)) as ProjectDocument;
}

function nextVersionNumber(projectId: string, records: StoredRevisionRecord[]): number {
    const highest = records
        .filter(entry => entry.revision.projectId === projectId)
        .reduce((max, entry) => Math.max(max, entry.revision.versionNumber), 0);

    return highest + 1;
}

export class LocalRevisionStorage implements RevisionStorage {
    async createRevision(
        project: ProjectDocument,
        message: string,
        createdBy: string
    ): Promise<ProjectRevision> {
        const records = readIndex();
        const revision: ProjectRevision = {
            id: crypto.randomUUID(),
            projectId: project.id,
            versionNumber: nextVersionNumber(project.id, records),
            createdAt: new Date().toISOString(),
            createdBy,
            message: message.trim(),
            snapshot: cloneProjectDocument(project)
        };

        upsertRecord({ revision });
        return revision;
    }

    async getRevisions(projectId: string): Promise<ProjectRevision[]> {
        return readIndex()
            .map(entry => entry.revision)
            .filter(revision => revision.projectId === projectId)
            .sort((left, right) => right.versionNumber - left.versionNumber);
    }

    async getRevision(revisionId: string): Promise<ProjectRevision | null> {
        const record = readRecord(revisionId);
        return record ? record.revision : null;
    }
}

export const localRevisionStorage = new LocalRevisionStorage();
