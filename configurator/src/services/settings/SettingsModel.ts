import type { BOMCategory } from "../bom/BOMModel";
import type { ProjectFabricKind } from "../../models/ProjectModel";

export interface QuoteDefaults {
    currency: string;
    taxRate: number;
    terms: string;
}

export type ManufacturingUnits = "metric" | "imperial";

export interface ManufacturingDefaults {
    units: ManufacturingUnits;
    notes: string;
}

export interface CompanySettings {
    id: string;
    organizationId: string;
    companyName: string;
    logoAssetId: string | null;
    address: string;
    email: string;
    phone: string;
    quoteDefaults: QuoteDefaults;
    manufacturingDefaults: ManufacturingDefaults;
}

export interface CatalogFabricItem {
    id: string;
    name: string;
    fabricKind: ProjectFabricKind;
    sku?: string;
    unit?: string;
    pricePerUnit?: number;
}

export interface CatalogFrameOption {
    id: string;
    name: string;
    category: BOMCategory;
    sku?: string;
    unit?: string;
    price?: number;
}

export interface CatalogAccessory {
    id: string;
    name: string;
    sku?: string;
    unit?: string;
    price?: number;
}

export interface MaterialCatalog {
    id: string;
    organizationId: string;
    fabrics: CatalogFabricItem[];
    frameOptions: CatalogFrameOption[];
    accessories: CatalogAccessory[];
}

export type CompanySettingsUpdate = Partial<
    Omit<CompanySettings, "id" | "organizationId">
>;

export type MaterialCatalogUpdate = Partial<
    Omit<MaterialCatalog, "id" | "organizationId">
>;

/** Reserved for ERP / multi-site organization metadata. */
export interface OrganizationRef {
    organizationId: string;
    name: string;
}
