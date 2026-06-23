import type { ProjectDocument } from "../../models/ProjectModel";

export type ERPProvider = "mock" | "entersoft" | "rest";

export interface ERPConnectionSettings {
    /** Reserved for Entersoft / REST integrations. */
    baseUrl?: string;
    apiVersion?: string;
    companyCode?: string;
    /** Mock adapter simulated latency in milliseconds. */
    mockLatencyMs?: number;
}

export interface ERPConnection {
    id: string;
    provider: ERPProvider;
    enabled: boolean;
    settings: ERPConnectionSettings;
}

export interface ERPExportResult {
    success: boolean;
    externalId: string | null;
    timestamp: string;
    errors: string[];
}

export interface ERPConnectionTestResult {
    connected: boolean;
    provider: ERPProvider;
    message: string;
    testedAt: string;
}

/** Integration-layer customer payload — no ERP IDs on core models. */
export interface ERPCustomerPayload {
    sourceProjectId?: string;
    sourceQuoteId?: string;
    name: string;
    email: string;
    company: string;
}

/** Integration-layer project/order payload. */
export interface ERPProjectPayload {
    sourceProjectId: ProjectDocument["id"];
    name: string;
    moduleCount: number;
    floorWidthCm: number;
    floorDepthCm: number;
    updatedAt: string;
    lineSummary: ERPOrderLineSummary[];
}

export interface ERPOrderLineSummary {
    name: string;
    quantity: number;
    unit: string;
    category: string;
}

/** Integration-layer quote payload. */
export interface ERPQuotePayload {
    sourceQuoteId: string;
    quoteNumber: string;
    projectName: string;
    currency: string;
    subtotal: number;
    tax: number;
    total: number;
    createdAt: string;
    customer: ERPCustomerPayload;
    lines: ERPQuoteLinePayload[];
}

export interface ERPQuoteLinePayload {
    name: string;
    quantity: number;
    unit: string;
    unitPrice: number | null;
    totalPrice: number | null;
}

/** Integration-layer manufacturing payload. */
export interface ERPManufacturingPayload {
    sourcePackageId: string;
    sourceProjectId: string;
    revisionId: string | null;
    createdAt: string;
    componentCount: number;
    fabricCount: number;
    artworkCount: number;
    components: ERPManufacturingComponentPayload[];
    fabrics: ERPManufacturingFabricPayload[];
}

export interface ERPManufacturingComponentPayload {
    moduleId: string;
    type: string;
    quantity: number;
    notes: string;
}

export interface ERPManufacturingFabricPayload {
    moduleId: string;
    face: string;
    widthCm: number;
    heightCm: number;
    fabricType: string;
}

/** Stored separately from core domain models. */
export interface ERPExportReference {
    id: string;
    provider: ERPProvider;
    sourceType: "project" | "quote" | "manufacturing" | "customer";
    sourceId: string;
    externalId: string | null;
    exportedAt: string;
}

/** Reserved for Entersoft-specific mapping metadata. */
export interface EntersoftAdapterRef {
    provider: "entersoft";
    documentType: string | null;
}

/** Reserved for generic REST ERP endpoints. */
export interface RestERPAdapterRef {
    provider: "rest";
    resourcePath: string | null;
}

export const ERP_PROVIDERS: ERPProvider[] = ["mock", "entersoft", "rest"];

export function formatERPProvider(provider: ERPProvider): string {
    switch (provider) {
        case "mock":
            return "Mock ERP";
        case "entersoft":
            return "Entersoft";
        case "rest":
            return "Generic REST ERP";
    }
}
