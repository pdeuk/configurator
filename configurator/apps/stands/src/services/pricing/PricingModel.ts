import type { BOMCategory, BOMDocument, BOMLine } from "../bom/BOMModel";
import type { StandModule } from "../../models/ModuleModel";

export type PriceCatalogItemId =
    | "wall-frame"
    | "fabric-standard"
    | "fabric-blockout"
    | "fabric-luminous"
    | "cube-frame"
    | "promo-stand-frame"
    | "melamine"
    | "shelf"
    | "door"
    | "banner-frame"
    | (string & {});

export interface PriceItem {
    id: PriceCatalogItemId;
    category: BOMCategory | "fabric" | "hardware";
    name: string;
    unit: string;
    price: number;
}

export interface PriceCatalog {
    version: string;
    currency: string;
    items: PriceItem[];
}

export type QuotePricingStatus = "priced" | "missing" | "overridden";

export interface QuoteLineBOMReference {
    bomLineId: BOMLine["id"];
    category: BOMCategory;
    name: BOMLine["name"];
    sourceModuleId: StandModule["id"] | null;
}

export interface QuoteLine {
    id: string;
    bom: QuoteLineBOMReference;
    quantity: number;
    unit: string;
    unitPrice: number | null;
    totalPrice: number | null;
    priceCatalogItemId: PriceCatalogItemId | null;
    pricingStatus: QuotePricingStatus;
}

export interface QuoteDocument {
    generatedAt: string;
    catalogVersion: PriceCatalog["version"];
    currency: string;
    subtotal: number;
    tax: number;
    total: number;
    lines: QuoteLine[];
    unpricedLineCount: number;
}

/** Per-BOM-line unit price overrides keyed by BOM line id. */
export type QuoteLinePriceOverrides = Record<BOMLine["id"], number>;

/** Per-catalog-item unit price overrides keyed by price item id. */
export type PriceCatalogItemOverrides = Partial<Record<PriceCatalogItemId, number>>;

export interface PricingCalculationOptions {
    /** Tax rate as a decimal fraction, e.g. 0.21 for 21%. Defaults to 0. */
    taxRate?: number;
    /** Override unit prices for specific BOM lines. */
    lineOverrides?: QuoteLinePriceOverrides;
    /** Override catalog unit prices without mutating the catalog. */
    catalogOverrides?: PriceCatalogItemOverrides;
    /** Optional customer-specific catalog layered on top of the base catalog. */
    customerCatalog?: PriceCatalog | null;
    /** Reserved for future account-based pricing rules. */
    customerId?: string | null;
}

/** Reserved for PDF quote generation metadata. */
export interface QuoteExportContext {
    projectId?: string;
    projectName?: string;
    customerId?: string | null;
    quoteNumber?: string | null;
    bom: BOMDocument;
    quote: QuoteDocument;
}

/** Reserved for ERP pricing sync — maps BOM output to external SKU pricing. */
export interface ERPPricingSyncRef {
    catalogVersion: PriceCatalog["version"];
    currency: string;
    itemMappings: Array<{
        priceCatalogItemId: PriceCatalogItemId;
        externalSku: string | null;
    }>;
}

/** Reserved for customer-account pricing profiles. */
export interface CustomerPricingProfile {
    customerId: string;
    preferredCurrency?: string;
    catalogOverrides?: PriceCatalogItemOverrides;
    lineOverrides?: QuoteLinePriceOverrides;
    discountRate?: number;
}

export function createQuoteLineBOMReference(bomLine: BOMLine): QuoteLineBOMReference {
    return {
        bomLineId: bomLine.id,
        category: bomLine.category,
        name: bomLine.name,
        sourceModuleId: bomLine.sourceModuleId
    };
}
