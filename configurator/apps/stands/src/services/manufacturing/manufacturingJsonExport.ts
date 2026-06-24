import type {
    ManufacturingJsonExportDocument,
    ManufacturingPackage
} from "./ManufacturingModel";

export interface DownloadManufacturingJsonOptions {
    fileName?: string;
    projectName?: string;
}

export function createManufacturingJsonExport(
    manufacturingPackage: ManufacturingPackage
): ManufacturingJsonExportDocument {
    return {
        export: {
            format: "configurator-manufacturing-v1",
            packageId: manufacturingPackage.id,
            projectId: manufacturingPackage.projectId,
            revisionId: manufacturingPackage.revisionId,
            exportedAt: new Date().toISOString()
        },
        package: manufacturingPackage,
        planning: {
            packageId: manufacturingPackage.id,
            componentCount: manufacturingPackage.components.length,
            fabricPieceCount: manufacturingPackage.fabrics.length,
            artworkFileCount: manufacturingPackage.artworkFiles.length
        }
    };
}

export function serializeManufacturingJson(
    manufacturingPackage: ManufacturingPackage
): string {
    return JSON.stringify(createManufacturingJsonExport(manufacturingPackage), null, 2);
}

export function downloadManufacturingJSON(
    manufacturingPackage: ManufacturingPackage,
    options: DownloadManufacturingJsonOptions = {}
): void {
    const payload = serializeManufacturingJson(manufacturingPackage);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const baseName = options.projectName?.trim().replace(/[^\w\-]+/g, "-").toLowerCase()
        || manufacturingPackage.projectId;

    anchor.href = url;
    anchor.download = options.fileName ?? `${baseName}-manufacturing.json`;
    anchor.click();
    URL.revokeObjectURL(url);
}
