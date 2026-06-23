import type { ProjectDocument } from "../models/ProjectModel";
import { normalizeProjectDocument } from "../lib/projectSerialization";

const LOCAL_STORAGE_PREFIX = "configurator:project:";

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

export class LocalStorageProjectStorage implements StorageService {
    private storageKey(projectId: string): string {
        return `${LOCAL_STORAGE_PREFIX}${projectId}`;
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
    }

    async saveProject(project: ProjectDocument): Promise<void> {
        this.saveProjectSync(project);
    }

    async deleteProject(projectId: string): Promise<void> {
        localStorage.removeItem(this.storageKey(projectId));
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
}

/** Default local adapter until a cloud-backed service is wired in. */
export const localProjectStorage = new LocalStorageProjectStorage();
