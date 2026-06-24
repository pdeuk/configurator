import type { BOMDocument } from "../bom/BOMModel";
import type { ProjectDocument } from "../../models/ProjectModel";
import type { QuoteDocument as PricingQuoteDocument } from "../pricing/PricingModel";

export interface QuoteCustomer {
    name: string;
    email: string;
    company: string;
}

export interface QuoteProjectInfo {
    name: string;
    previewImages: string[];
}

/** Standalone sales quote — separate from ProjectDocument and pricing snapshots. */
export interface QuoteDocument {
    id: string;
    quoteNumber: string;
    createdAt: string;
    customer: QuoteCustomer;
    project: QuoteProjectInfo;
    bom: BOMDocument;
    pricing: PricingQuoteDocument;
    notes: string;
    terms: string;
}

export interface QuoteCompanyHeader {
    name: string;
    addressLines: string[];
    email: string;
    phone: string;
    website?: string;
}

export interface QuoteArtworkEntry {
    moduleId: string;
    face: string;
    fileName: string;
    fileType: string;
    printWidthCm: number;
    printHeightCm: number;
    effectiveDpi: number;
    fabricKind: string;
}

export interface QuoteFabricSummary {
    name: string;
    areaSquareMeters: number;
    unit: string;
}

export interface QuoteMaterialsSummary {
    fabrics: QuoteFabricSummary[];
    artwork: QuoteArtworkEntry[];
}

export interface GenerateQuoteInput {
    customer?: Partial<QuoteCustomer>;
    previewImages?: string[];
    notes?: string;
    terms?: string;
    quoteNumber?: string;
    projectName?: string;
}

/** Reserved for future customer-account linkage. */
export interface QuoteCustomerAccountRef {
    customerId: string | null;
    accountEmail: string | null;
}

export const DEFAULT_QUOTE_NOTES =
    "Thank you for your enquiry. This quote is based on the current project configuration and artwork supplied in the configurator.";

export const DEFAULT_QUOTE_TERMS =
    "Quote valid for 30 days from the issue date. Prices exclude delivery, installation, and VAT unless stated otherwise. Artwork must meet minimum print resolution requirements before production.";

export const DEFAULT_QUOTE_COMPANY_HEADER: QuoteCompanyHeader = {
    name: "Your Company Name",
    addressLines: ["Street Address", "City, Country"],
    email: "quotes@company.com",
    phone: "+00 000 000 000",
    website: "www.company.com"
};

export function createEmptyQuoteCustomer(
    overrides: Partial<QuoteCustomer> = {}
): QuoteCustomer {
    return {
        name: overrides.name ?? "",
        email: overrides.email ?? "",
        company: overrides.company ?? ""
    };
}

export function collectQuoteMaterials(
    project: ProjectDocument,
    bom: BOMDocument
): QuoteMaterialsSummary {
    const assetsById = new Map(
        project.artworkAssets.map(asset => [asset.id, asset])
    );
    const fabrics = bom.lines
        .filter(line => line.category === "fabric")
        .map(line => ({
            name: line.name,
            areaSquareMeters: line.quantity,
            unit: line.unit
        }));
    const artwork: QuoteArtworkEntry[] = [];

    for (const assignment of project.artworkAssignments) {
        const asset = assetsById.get(assignment.artworkAssetId);

        if (!asset) {
            continue;
        }

        const module = project.modules.find(entry => entry.id === assignment.moduleId);
        const fabric = module?.fabrics.find(entry => entry.side === assignment.face);
        const fabricKind = fabric?.fabricKind ?? "standard";

        artwork.push({
            moduleId: assignment.moduleId,
            face: assignment.face,
            fileName: asset.fileName,
            fileType: asset.fileType.toUpperCase(),
            printWidthCm: asset.printWidthCm,
            printHeightCm: asset.printHeightCm,
            effectiveDpi: Math.round(asset.effectiveDpi),
            fabricKind
        });
    }

    return { fabrics, artwork };
}
