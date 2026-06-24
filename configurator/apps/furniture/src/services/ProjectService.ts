import type { ProjectDocument } from "../models/ProjectModel";
import {
    createEmptyProjectBomSnapshot,
    createEmptyProjectOwnership,
    createEmptyProjectQuoteRef
} from "../models/ProjectModel";
import {
    DEFAULT_FLOOR_DIMENSIONS,
    DEFAULT_FLOOR_MATERIAL_ID
} from "../utils/floorMaterials";
import { createDefaultFabrics } from "../utils/fabrics";
import type { StandModule } from "../models/ModuleModel";
import {
    persistableStateToProjectDocument,
    projectDocumentToPersistableState,
    selectPersistableEditorState
} from "../lib/projectSerialization";
import type { PersistableEditorState } from "../models/ProjectModel";
import type { StorageService } from "./StorageService";
import {
    DEFAULT_PROJECT_ID,
    DEFAULT_PROJECT_NAME
} from "../lib/projectConstants";

export { DEFAULT_PROJECT_ID, DEFAULT_PROJECT_NAME };

export interface ProjectDocumentMetadata {
    id: string;
    name: string;
    createdAt: string;
    ownership: ProjectDocument["ownership"];
    quote: ProjectDocument["quote"];
    bom: ProjectDocument["bom"];
}

function createDefaultWallModule(): StandModule {
    return {
        id: "wall-001",
        type: "wall",
        position: {
            x: 0,
            y: 0,
            z: 0
        },
        rotation: Math.PI,
        width: 1,
        height: 2,
        depth: 0.05,
        fabrics: createDefaultFabrics("wall")
    };
}

export function createDefaultProjectDocument(
    overrides: Partial<Pick<ProjectDocument, "id" | "name">> = {}
): ProjectDocument {
    const timestamp = new Date().toISOString();
    const id = overrides.id ?? DEFAULT_PROJECT_ID;
    const name = overrides.name ?? DEFAULT_PROJECT_NAME;

    return persistableStateToProjectDocument(
        {
            moduleIds: ["wall-001"],
            modulesById: {
                "wall-001": createDefaultWallModule()
            },
            floorMaterialId: DEFAULT_FLOOR_MATERIAL_ID,
            floorSize: DEFAULT_FLOOR_DIMENSIONS,
            showGrid: true
        },
        {
            id,
            name,
            createdAt: timestamp,
            updatedAt: timestamp
        },
        {
            ownership: createEmptyProjectOwnership(),
            quote: createEmptyProjectQuoteRef(),
            bom: createEmptyProjectBomSnapshot()
        }
    );
}

export {
    persistableStateToProjectDocument,
    projectDocumentToPersistableState,
    selectPersistableEditorState
} from "../lib/projectSerialization";

export class ProjectService {
    private readonly storage: StorageService;

    constructor(storage: StorageService) {
        this.storage = storage;
    }

    loadSync(projectId: string): ProjectDocument | null {
        return this.storage.loadProjectSync(projectId);
    }

    async load(projectId: string): Promise<ProjectDocument | null> {
        return this.storage.loadProject(projectId);
    }

    async saveDocument(project: ProjectDocument): Promise<ProjectDocument> {
        const document: ProjectDocument = {
            ...project,
            updatedAt: new Date().toISOString()
        };

        await this.storage.saveProject(document);

        return document;
    }

    async save(
        projectId: string,
        state: PersistableEditorState,
        metadata: ProjectDocumentMetadata
    ): Promise<ProjectDocument> {
        const document = persistableStateToProjectDocument(
            state,
            {
                id: projectId,
                name: metadata.name,
                createdAt: metadata.createdAt,
                updatedAt: new Date().toISOString()
            },
            {
                ownership: metadata.ownership,
                quote: metadata.quote,
                bom: metadata.bom
            }
        );

        await this.storage.saveProject(document);

        return document;
    }

    async delete(projectId: string): Promise<void> {
        await this.storage.deleteProject(projectId);
    }

    async listProjects(): Promise<ProjectDocument[]> {
        return this.storage.listProjects();
    }
}

export function exportPersistableEditorState(state: PersistableEditorState): PersistableEditorState {
    return selectPersistableEditorState(state);
}

export function importProjectDocument(document: ProjectDocument): PersistableEditorState {
    return projectDocumentToPersistableState(document);
}
