import type { ModuleType, Position3 } from "../../models/ModuleModel";
import type { ProjectDocument, ProjectFabricKind } from "../../models/ProjectModel";

export interface ManufacturingDimensions {
    widthCm: number;
    heightCm: number;
    depthCm?: number;
}

export interface ManufacturingComponent {
    moduleId: string;
    type: ModuleType;
    dimensions: ManufacturingDimensions;
    quantity: number;
    position: Position3;
    rotation: number;
    notes: string;
}

export interface FabricCutSheet {
    moduleId: string;
    face: string;
    widthCm: number;
    heightCm: number;
    fabricType: string;
    artworkAssetId: string | null;
}

export interface ManufacturingArtworkFile {
    assetId: string;
    fileName: string;
    printWidthCm: number;
    printHeightCm: number;
    dpiX: number;
    dpiY: number;
    effectiveDpi: number;
    moduleId: string | null;
    face: string | null;
}

export interface ManufacturingPackage {
    id: string;
    projectId: ProjectDocument["id"];
    revisionId: string | null;
    createdAt: string;
    components: ManufacturingComponent[];
    fabrics: FabricCutSheet[];
    artworkFiles: ManufacturingArtworkFile[];
    assemblyNotes: string[];
}

export interface GenerateManufacturingPackageOptions {
    revisionId?: string | null;
    /** When provided, package content is generated from this snapshot. */
    sourceDocument?: ProjectDocument;
}

/** Reserved for ERP / MRP integrations. */
export interface ManufacturingErpExportRef {
    format: "configurator-manufacturing-v1";
    packageId: string;
    projectId: string;
    revisionId: string | null;
    exportedAt: string;
}

/** Reserved for CNC / cutting table integrations. */
export interface ManufacturingCuttingExportRef {
    format: "configurator-cutting-v1";
    packageId: string;
    cutSheetCount: number;
    exportedAt: string;
}

/** Reserved for production planning systems. */
export interface ManufacturingPlanningExportRef {
    packageId: string;
    componentCount: number;
    fabricPieceCount: number;
    artworkFileCount: number;
}

export interface ManufacturingJsonExportDocument {
    export: ManufacturingErpExportRef;
    package: ManufacturingPackage;
    planning: ManufacturingPlanningExportRef;
}

export function formatFabricTypeLabel(fabricKind: ProjectFabricKind): string {
    switch (fabricKind) {
        case "blockout":
            return "Blockout fabric";
        case "luminous":
            return "Luminous fabric";
        case "standard":
            return "Standard fabric";
    }
}

export function formatManufacturingSize(dimensions: ManufacturingDimensions): string {
    const width = Math.round(dimensions.widthCm);
    const height = Math.round(dimensions.heightCm);

    if (dimensions.depthCm !== undefined) {
        return `${width}cm x ${height}cm x ${Math.round(dimensions.depthCm)}cm`;
    }

    return `${width}cm x ${height}cm`;
}
