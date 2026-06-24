import type { PersistableEditorState, ProjectDocument } from "../models/ProjectModel";
import { projectDocumentToPersistableState } from "./projectSerialization";
import {
    createDefaultProjectDocument,
    type ProjectDocumentMetadata
} from "../services/ProjectService";
import { localProjectStorage } from "../services/StorageService";
import {
    DEFAULT_PROJECT_ID,
    DEFAULT_PROJECT_NAME,
    ACTIVE_PROJECT_ID_KEY
} from "./projectConstants";

export function readActiveProjectId(): string {
    try {
        return sessionStorage.getItem(ACTIVE_PROJECT_ID_KEY) ?? DEFAULT_PROJECT_ID;
    } catch {
        return DEFAULT_PROJECT_ID;
    }
}

export function writeActiveProjectId(projectId: string): void {
    try {
        sessionStorage.setItem(ACTIVE_PROJECT_ID_KEY, projectId);
    } catch {
        // Ignore session storage failures in private browsing modes.
    }
}

export function pickProjectDocumentMetadata(
    document: ProjectDocument
): ProjectDocumentMetadata {
    return {
        id: document.id,
        name: document.name,
        createdAt: document.createdAt,
        ownership: document.ownership,
        quote: document.quote,
        bom: document.bom
    };
}

export function readProjectDocumentOrDefault(
    projectId: string = DEFAULT_PROJECT_ID,
    projectName: string = DEFAULT_PROJECT_NAME
): ProjectDocument {
    try {
        const stored = localProjectStorage.loadProjectSync(projectId);

        if (stored) {
            return stored;
        }
    } catch (error) {
        console.warn("Could not restore saved project; starting from default stand.", error);
    }

    return createDefaultProjectDocument({
        id: projectId,
        name: projectName
    });
}

export function getInitialPersistableState(
    projectId: string = readActiveProjectId(),
    projectName: string = DEFAULT_PROJECT_NAME
): PersistableEditorState {
    return projectDocumentToPersistableState(
        readProjectDocumentOrDefault(projectId, projectName)
    );
}
