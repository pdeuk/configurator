import type { ProjectDocument, ProjectListItem } from "../models/ProjectModel";
import { normalizeProjectDocument } from "../lib/projectSerialization";

const LOCAL_STORAGE_PREFIX = "configurator:project:";
const LOCAL_STORAGE_INDEX_KEY = "configurator:projects:index";

export interface ProjectLoadResult {
    document: ProjectDocument | null;
    error: "missing" | "parse_error" | "migration_error" | null;
}

/** Persistence boundary — swap implementation for cloud storage later. */
export interface StorageService {
    loadProject(projectId: string): Promise<ProjectDocument | null>;
    loadProjectSync(projectId: string): ProjectDocument | null;
    saveProject(project: ProjectDocument): Promise<void>;
    saveProjectSync(project: ProjectDocument): void;
    deleteProject(projectId: string): Promise<void>;
    listProjects(): Promise<ProjectDocument[]>;
    listProjectSummaries(): Promise<ProjectListItem[]>;
}

function parseStoredProject(raw: string): ProjectLoadResult {
    try {
        const parsed: unknown = JSON.parse(raw);
        const document = normalizeProjectDocument(parsed);

        if (!document) {
            return {
                document: null,
                error: "migration_error"
            };
        }

        return {
            document,
            error: null
        };
    } catch {
        return {
            document: null,
            error: "parse_error"
        };
    }
}

function projectToListItem(project: ProjectDocument): ProjectListItem {
    return {
        id: project.id,
        name: project.name,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        ownership: project.ownership,
        quote: project.quote,
        bom: project.bom,
        moduleCount: project.modules.length,
        floorWidth: project.floor.width,
        floorDepth: project.floor.depth
    };
}

function isProjectListItem(value: unknown): value is ProjectListItem {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ProjectListItem>;

    return (
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.updatedAt === "string" &&
        candidate.ownership !== null &&
        typeof candidate.ownership === "object" &&
        candidate.quote !== null &&
        typeof candidate.quote === "object" &&
        candidate.bom !== null &&
        typeof candidate.bom === "object"
    );
}

function sortProjectListItems(projects: ProjectListItem[]): ProjectListItem[] {
    return projects.sort((left, right) =>
        right.updatedAt.localeCompare(left.updatedAt)
    );
}

export class LocalStorageProjectStorage implements StorageService {
    private storageKey(projectId: string): string {
        return `${LOCAL_STORAGE_PREFIX}${projectId}`;
    }

    private readIndex(): ProjectListItem[] {
        const raw = localStorage.getItem(LOCAL_STORAGE_INDEX_KEY);

        if (!raw) {
            return [];
        }

        try {
            const parsed: unknown = JSON.parse(raw);

            if (!Array.isArray(parsed)) {
                return [];
            }

            return parsed.filter(isProjectListItem);
        } catch {
            return [];
        }
    }

    private writeIndex(projects: ProjectListItem[]): void {
        localStorage.setItem(
            LOCAL_STORAGE_INDEX_KEY,
            JSON.stringify(sortProjectListItems(projects))
        );
    }

    private upsertIndex(project: ProjectDocument): void {
        const summary = projectToListItem(project);
        const next = this.readIndex().filter(item => item.id !== project.id);
        next.push(summary);
        this.writeIndex(next);
    }

    private rebuildIndexFromStoredProjects(): ProjectListItem[] {
        const summaries: ProjectListItem[] = [];

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);

            if (!key?.startsWith(LOCAL_STORAGE_PREFIX)) {
                continue;
            }

            const projectId = key.slice(LOCAL_STORAGE_PREFIX.length);
            const document = this.loadProjectSync(projectId);

            if (document) {
                summaries.push(projectToListItem(document));
            }
        }

        this.writeIndex(summaries);

        return sortProjectListItems(summaries);
    }

    loadProjectSync(projectId: string): ProjectDocument | null {
        const raw = localStorage.getItem(this.storageKey(projectId));

        if (!raw) {
            return null;
        }

        const result = parseStoredProject(raw);

        if (result.error) {
            console.warn(
                `Could not load project "${projectId}" (${result.error}).`
            );
        }

        return result.document;
    }

    async loadProject(projectId: string): Promise<ProjectDocument | null> {
        return this.loadProjectSync(projectId);
    }

    saveProjectSync(project: ProjectDocument): void {
        localStorage.setItem(this.storageKey(project.id), JSON.stringify(project));
        this.upsertIndex(project);
    }

    async saveProject(project: ProjectDocument): Promise<void> {
        this.saveProjectSync(project);
    }

    async deleteProject(projectId: string): Promise<void> {
        localStorage.removeItem(this.storageKey(projectId));
        this.writeIndex(this.readIndex().filter(item => item.id !== projectId));
    }

    async listProjects(): Promise<ProjectDocument[]> {
        const projects: ProjectDocument[] = [];

        for (let index = 0; index < localStorage.length; index += 1) {
            const key = localStorage.key(index);

            if (!key?.startsWith(LOCAL_STORAGE_PREFIX)) {
                continue;
            }

            const projectId = key.slice(LOCAL_STORAGE_PREFIX.length);
            const document = await this.loadProject(projectId);

            if (document) {
                projects.push(document);
            }
        }

        return projects.sort((left, right) =>
            right.updatedAt.localeCompare(left.updatedAt)
        );
    }

    async listProjectSummaries(): Promise<ProjectListItem[]> {
        const indexed = this.readIndex();

        if (indexed.length > 0) {
            return sortProjectListItems(indexed);
        }

        return this.rebuildIndexFromStoredProjects();
    }
}

/** Default local adapter until a cloud-backed service is wired in. */
export const localProjectStorage = new LocalStorageProjectStorage();
