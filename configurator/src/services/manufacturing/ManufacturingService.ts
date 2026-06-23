import type { ProjectDocument } from "../../models/ProjectModel";
import type { ProjectRevision } from "../versions";
import type {
    GenerateManufacturingPackageOptions,
    ManufacturingJsonExportDocument,
    ManufacturingPackage
} from "./ManufacturingModel";
import { buildManufacturingPackage } from "./packageBuilder";
import {
    createManufacturingJsonExport,
    downloadManufacturingJSON,
    serializeManufacturingJson,
    type DownloadManufacturingJsonOptions
} from "./manufacturingJsonExport";
import {
    downloadManufacturingPDF,
    type DownloadManufacturingPdfOptions
} from "./manufacturingPdfExport";

export type ManufacturingRevisionInput =
    | Pick<ProjectRevision, "id" | "snapshot">
    | null
    | undefined;

/** Reserved for ERP import hooks. */
function notifyManufacturingExport(
    _channel: "json" | "pdf",
    _manufacturingPackage: ManufacturingPackage
): void {
    // Intentionally empty — wired later for ERP / cutting integrations.
}

export class ManufacturingService {
    generateManufacturingPackage(
        project: ProjectDocument,
        revision?: ManufacturingRevisionInput,
        options: GenerateManufacturingPackageOptions = {}
    ): ManufacturingPackage {
        const revisionId = revision?.id ?? options.revisionId ?? null;
        const sourceDocument = revision?.snapshot ?? options.sourceDocument ?? project;

        return buildManufacturingPackage(project, {
            revisionId,
            sourceDocument
        });
    }

    serializeManufacturingJson(manufacturingPackage: ManufacturingPackage): string {
        return serializeManufacturingJson(manufacturingPackage);
    }

    createManufacturingJsonExport(
        manufacturingPackage: ManufacturingPackage
    ): ManufacturingJsonExportDocument {
        return createManufacturingJsonExport(manufacturingPackage);
    }

    async downloadManufacturingPDF(
        manufacturingPackage: ManufacturingPackage,
        options: DownloadManufacturingPdfOptions = {}
    ): Promise<void> {
        notifyManufacturingExport("pdf", manufacturingPackage);
        await downloadManufacturingPDF(manufacturingPackage, options);
    }

    downloadManufacturingJSON(
        manufacturingPackage: ManufacturingPackage,
        options: DownloadManufacturingJsonOptions = {}
    ): void {
        notifyManufacturingExport("json", manufacturingPackage);
        downloadManufacturingJSON(manufacturingPackage, options);
    }
}

export const manufacturingService = new ManufacturingService();

export function generateManufacturingPackage(
    project: ProjectDocument,
    revision?: ManufacturingRevisionInput,
    options?: GenerateManufacturingPackageOptions
): ManufacturingPackage {
    return manufacturingService.generateManufacturingPackage(project, revision, options);
}

export {
    downloadManufacturingJSON,
    downloadManufacturingPDF,
    serializeManufacturingJson
};

export type {
    DownloadManufacturingJsonOptions
} from "./manufacturingJsonExport";
export type {
    DownloadManufacturingPdfOptions
} from "./manufacturingPdfExport";
