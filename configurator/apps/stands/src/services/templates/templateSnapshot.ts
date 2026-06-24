import { PROJECT_SCHEMA_VERSION } from "../../lib/schemaVersion";
import type { ProjectDocument } from "../../models/ProjectModel";
import {
    createEmptyProjectBomSnapshot,
    createEmptyProjectOwnership,
    createEmptyProjectQuoteRef,
    type ProjectArtworkAsset
} from "../../models/ProjectModel";
import type { ProjectTemplateSnapshot } from "./TemplateModel";

function cloneSnapshot<T>(value: T): T {
    return structuredClone(value);
}

function remapArtworkPaths(
    assets: ProjectArtworkAsset[],
    projectId: string
): ProjectArtworkAsset[] {
    return assets.map(asset => ({
        ...asset,
        storage: {
            ...asset.storage,
            path: `${projectId}/assets/${asset.id}/${asset.fileName}`
        }
    }));
}

export function extractTemplateSnapshot(project: ProjectDocument): ProjectTemplateSnapshot {
    return {
        schemaVersion: project.schemaVersion,
        floor: cloneSnapshot(project.floor),
        scene: cloneSnapshot(project.scene),
        modules: cloneSnapshot(project.modules),
        artworkAssets: cloneSnapshot(project.artworkAssets),
        artworkAssignments: cloneSnapshot(project.artworkAssignments)
    };
}

export function instantiateProjectFromSnapshot(
    snapshot: ProjectTemplateSnapshot,
    options: { id: string; name: string }
): ProjectDocument {
    const timestamp = new Date().toISOString();
    const artworkAssets = remapArtworkPaths(cloneSnapshot(snapshot.artworkAssets), options.id);

    return {
        schemaVersion: snapshot.schemaVersion ?? PROJECT_SCHEMA_VERSION,
        id: options.id,
        name: options.name,
        createdAt: timestamp,
        updatedAt: timestamp,
        ownership: createEmptyProjectOwnership(),
        quote: createEmptyProjectQuoteRef(),
        bom: createEmptyProjectBomSnapshot(),
        floor: cloneSnapshot(snapshot.floor),
        scene: cloneSnapshot(snapshot.scene),
        modules: cloneSnapshot(snapshot.modules),
        artworkAssets,
        artworkAssignments: cloneSnapshot(snapshot.artworkAssignments)
    };
}
