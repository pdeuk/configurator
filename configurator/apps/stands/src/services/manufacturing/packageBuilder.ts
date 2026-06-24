import type { FabricSide } from "../../models/ModuleModel";
import type { ProjectDocument, ProjectModule } from "../../models/ProjectModel";
import type { BOMLine } from "../bom/BOMModel";
import {
    collectFabricAreas,
    collectModuleLines,
    projectModuleToStandModuleShape,
    type ModuleBOMContext
} from "../bom/moduleCalculators";
import {
    formatBannerFabricLabel,
    getFabricDimensions,
    isBannerFabricSide,
    metersToCentimeters
} from "../../utils/fabrics";
import type {
    FabricCutSheet,
    ManufacturingArtworkFile,
    ManufacturingComponent,
    ManufacturingPackage
} from "./ManufacturingModel";
import { formatFabricTypeLabel } from "./ManufacturingModel";

function roundCm(value: number): number {
    return Math.round(value * 10) / 10;
}

function capitalizeFaceLabel(face: FabricSide | string): string {
    const fabricSide = face as FabricSide;

    if (isBannerFabricSide(fabricSide)) {
        return formatBannerFabricLabel(fabricSide);
    }

    return face.charAt(0).toUpperCase() + face.slice(1);
}

function buildModuleContext(module: ProjectModule): ModuleBOMContext {
    return {
        module,
        moduleShape: projectModuleToStandModuleShape(module)
    };
}

function bomLineToComponent(line: BOMLine, module: ProjectModule): ManufacturingComponent {
    return {
        moduleId: module.id,
        type: module.type,
        dimensions: {
            widthCm: roundCm(line.dimensions?.widthCm ?? metersToCentimeters(module.dimensions.width)),
            heightCm: roundCm(line.dimensions?.heightCm ?? metersToCentimeters(module.dimensions.height)),
            ...(line.dimensions?.depthCm !== undefined
                ? { depthCm: roundCm(line.dimensions.depthCm) }
                : {})
        },
        quantity: line.quantity,
        position: { ...module.position },
        rotation: module.rotation,
        notes: line.name
    };
}

function resolveArtworkAssetId(
    project: ProjectDocument,
    moduleId: string,
    face: FabricSide
): string | null {
    const module = project.modules.find(entry => entry.id === moduleId);
    const fabricFace = module?.fabrics.find(entry => entry.side === face);

    if (fabricFace?.artworkAssetId) {
        return fabricFace.artworkAssetId;
    }

    const assignment = project.artworkAssignments.find(
        entry => entry.moduleId === moduleId && entry.face === face
    );

    return assignment?.artworkAssetId ?? null;
}

function buildFabricCutSheets(project: ProjectDocument): FabricCutSheet[] {
    const sheets: FabricCutSheet[] = [];

    for (const module of project.modules) {
        const context = buildModuleContext(module);
        const contributions = collectFabricAreas(context);

        for (const contribution of contributions) {
            const dimensions = getFabricDimensions(context.moduleShape, contribution.face);

            sheets.push({
                moduleId: module.id,
                face: contribution.face,
                widthCm: roundCm(metersToCentimeters(dimensions.width)),
                heightCm: roundCm(metersToCentimeters(dimensions.height)),
                fabricType: formatFabricTypeLabel(contribution.fabricKind),
                artworkAssetId: resolveArtworkAssetId(project, module.id, contribution.face)
            });
        }
    }

    return sheets.sort((left, right) =>
        `${left.moduleId}:${left.face}`.localeCompare(`${right.moduleId}:${right.face}`)
    );
}

function buildComponents(project: ProjectDocument): ManufacturingComponent[] {
    const components: ManufacturingComponent[] = [];

    for (const module of project.modules) {
        const lines = collectModuleLines(buildModuleContext(module));

        for (const line of lines) {
            components.push(bomLineToComponent(line, module));
        }
    }

    return components;
}

function formatRotationDegrees(rotation: number): string {
    const degrees = (rotation * 180) / Math.PI;
    return `${Math.round(degrees)}°`;
}

function buildAssemblyNotes(project: ProjectDocument): string[] {
    const notes: string[] = [
        `Project "${project.name}" (${project.id})`,
        `Floor footprint: ${roundCm(metersToCentimeters(project.floor.width))}cm x ${roundCm(metersToCentimeters(project.floor.depth))}cm`,
        `Module count: ${project.modules.length}`
    ];

    if (project.scene.moduleOrder.length > 0) {
        notes.push(`Assembly order: ${project.scene.moduleOrder.join(" → ")}`);
    }

    for (const moduleId of project.scene.moduleOrder) {
        const module = project.modules.find(entry => entry.id === moduleId);

        if (!module) {
            continue;
        }

        const position = [
            roundCm(metersToCentimeters(module.position.x)),
            roundCm(metersToCentimeters(module.position.y)),
            roundCm(metersToCentimeters(module.position.z))
        ].join(", ");

        let line = `${module.type} [${module.id}] at (${position}) cm, rotation ${formatRotationDegrees(module.rotation)}`;

        if (module.snappedTo) {
            line += `, connected to ${module.snappedTo}`;
        }

        notes.push(line);
    }

    for (const module of project.modules) {
        if (project.scene.moduleOrder.includes(module.id)) {
            continue;
        }

        const position = [
            roundCm(metersToCentimeters(module.position.x)),
            roundCm(metersToCentimeters(module.position.y)),
            roundCm(metersToCentimeters(module.position.z))
        ].join(", ");

        notes.push(
            `${module.type} [${module.id}] at (${position}) cm, rotation ${formatRotationDegrees(module.rotation)}`
        );
    }

    return notes;
}

function buildArtworkManifest(
    project: ProjectDocument,
    fabrics: FabricCutSheet[]
): ManufacturingArtworkFile[] {
    const entries = new Map<string, ManufacturingArtworkFile>();

    for (const sheet of fabrics) {
        if (!sheet.artworkAssetId) {
            continue;
        }

        const asset = project.artworkAssets.find(entry => entry.id === sheet.artworkAssetId);

        if (!asset || entries.has(asset.id)) {
            continue;
        }

        entries.set(asset.id, {
            assetId: asset.id,
            fileName: asset.fileName,
            printWidthCm: roundCm(asset.printWidthCm),
            printHeightCm: roundCm(asset.printHeightCm),
            dpiX: asset.dpiX,
            dpiY: asset.dpiY,
            effectiveDpi: asset.effectiveDpi,
            moduleId: sheet.moduleId,
            face: sheet.face
        });
    }

    for (const assignment of project.artworkAssignments) {
        const asset = project.artworkAssets.find(entry => entry.id === assignment.artworkAssetId);

        if (!asset || entries.has(asset.id)) {
            continue;
        }

        entries.set(asset.id, {
            assetId: asset.id,
            fileName: asset.fileName,
            printWidthCm: roundCm(asset.printWidthCm),
            printHeightCm: roundCm(asset.printHeightCm),
            dpiX: asset.dpiX,
            dpiY: asset.dpiY,
            effectiveDpi: asset.effectiveDpi,
            moduleId: assignment.moduleId,
            face: assignment.face
        });
    }

    return [...entries.values()].sort((left, right) =>
        left.fileName.localeCompare(right.fileName)
    );
}

export function buildManufacturingPackage(
    project: ProjectDocument,
    options: {
        revisionId?: string | null;
        sourceDocument?: ProjectDocument;
    } = {}
): ManufacturingPackage {
    const source = options.sourceDocument ?? project;
    const fabrics = buildFabricCutSheets(source);

    return {
        id: crypto.randomUUID(),
        projectId: source.id,
        revisionId: options.revisionId ?? null,
        createdAt: new Date().toISOString(),
        components: buildComponents(source),
        fabrics,
        artworkFiles: buildArtworkManifest(source, fabrics),
        assemblyNotes: buildAssemblyNotes(source)
    };
}

export function summarizeComponentGroups(
    components: ManufacturingComponent[]
): Array<{ label: string; quantity: number; size: string }> {
    const groups = new Map<string, { label: string; quantity: number; size: string }>();

    for (const component of components) {
        const size = `${Math.round(component.dimensions.widthCm)}cm x ${Math.round(component.dimensions.heightCm)}cm`;
        const key = `${component.notes}|${size}`;
        const existing = groups.get(key);

        if (existing) {
            existing.quantity += component.quantity;
            continue;
        }

        groups.set(key, {
            label: component.notes,
            quantity: component.quantity,
            size
        });
    }

    return [...groups.values()].sort((left, right) => left.label.localeCompare(right.label));
}

export function formatFabricCutLabel(sheet: FabricCutSheet): string {
    return `${capitalizeFaceLabel(sheet.face)} fabric`;
}
