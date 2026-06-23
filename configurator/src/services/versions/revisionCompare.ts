import type { ProjectDocument } from "../../models/ProjectModel";
import type { RevisionComparison } from "./VersionModel";

function moduleFingerprint(module: ProjectDocument["modules"][number]): string {
    return JSON.stringify({
        id: module.id,
        type: module.type,
        position: module.position,
        rotation: module.rotation,
        dimensions: module.dimensions,
        segmentCount: module.segmentCount ?? null,
        hasMelamineTop: module.hasMelamineTop ?? null,
        fabrics: module.fabrics
    });
}

function compareSnapshots(
    snapshotA: ProjectDocument,
    snapshotB: ProjectDocument
): Omit<
    RevisionComparison,
    "revisionAId" | "revisionBId" | "versionA" | "versionB"
> {
    const summaryLines: string[] = [];
    const modulesA = new Map(snapshotA.modules.map(module => [module.id, module]));
    const modulesB = new Map(snapshotB.modules.map(module => [module.id, module]));
    const addedModuleIds: string[] = [];
    const removedModuleIds: string[] = [];
    const changedModuleIds: string[] = [];

    for (const moduleId of modulesB.keys()) {
        if (!modulesA.has(moduleId)) {
            addedModuleIds.push(moduleId);
        }
    }

    for (const moduleId of modulesA.keys()) {
        if (!modulesB.has(moduleId)) {
            removedModuleIds.push(moduleId);
        }
    }

    for (const [moduleId, moduleA] of modulesA.entries()) {
        const moduleB = modulesB.get(moduleId);

        if (!moduleB) {
            continue;
        }

        if (moduleFingerprint(moduleA) !== moduleFingerprint(moduleB)) {
            changedModuleIds.push(moduleId);
        }
    }

    if (snapshotA.name !== snapshotB.name) {
        summaryLines.push(`Project name changed: "${snapshotA.name}" → "${snapshotB.name}"`);
    }

    if (
        snapshotA.floor.width !== snapshotB.floor.width
        || snapshotA.floor.depth !== snapshotB.floor.depth
        || snapshotA.floor.materialId !== snapshotB.floor.materialId
    ) {
        summaryLines.push("Floor settings changed");
    }

    if (addedModuleIds.length > 0) {
        summaryLines.push(`${addedModuleIds.length} module(s) added`);
    }

    if (removedModuleIds.length > 0) {
        summaryLines.push(`${removedModuleIds.length} module(s) removed`);
    }

    if (changedModuleIds.length > 0) {
        summaryLines.push(`${changedModuleIds.length} module(s) modified`);
    }

    if (summaryLines.length === 0) {
        summaryLines.push("No structural differences detected");
    }

    return {
        summaryLines,
        moduleCountA: snapshotA.modules.length,
        moduleCountB: snapshotB.modules.length,
        addedModuleIds,
        removedModuleIds,
        changedModuleIds
    };
}

export function compareRevisionSnapshots(
    revisionAId: string,
    revisionBId: string,
    versionA: number,
    versionB: number,
    snapshotA: ProjectDocument,
    snapshotB: ProjectDocument
): RevisionComparison {
    return {
        revisionAId,
        revisionBId,
        versionA,
        versionB,
        ...compareSnapshots(snapshotA, snapshotB)
    };
}
