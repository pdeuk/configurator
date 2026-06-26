import type { ModuleType, StandModule } from "../../models/ModuleModel";
import type { PriceCatalogItemId } from "../pricing/PricingModel";

export interface CatalogCategory {
    id: string;
    name: string;
}

export interface CatalogDimensions {
    width: number;
    height: number;
    depth: number;
}

/** Persisted module layout without runtime id. */
export type ModuleCatalogSnapshot = Omit<StandModule, "id">;

export interface CatalogItem {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    category: string;
    thumbnail: string | null;
    moduleSnapshot: ModuleCatalogSnapshot;
    defaultDimensions: CatalogDimensions;
    /** Reserved for pricing catalog sync. */
    defaultPriceItemId: PriceCatalogItemId | null;
    createdAt: string;
}

export interface CreateCatalogItemOptions {
    name?: string;
    description?: string;
    categoryId?: string;
    thumbnail?: string | null;
    defaultPriceItemId?: PriceCatalogItemId | null;
}

export interface InsertCatalogItemOptions {
    moduleCount?: number;
}

export const DEFAULT_CATALOG_CATEGORIES: CatalogCategory[] = [
    { id: "wall", name: "Wall" },
    { id: "furniture", name: "Furniture" },
    { id: "lighting", name: "Lighting" },
    { id: "banner", name: "Banner" },
    { id: "accessory", name: "Accessory" },
    { id: "custom", name: "Custom" }
];

export const DEFAULT_CATALOG_THUMBNAIL =
    "data:image/svg+xml;utf8,"
    + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120" viewBox="0 0 160 120">'
        + '<rect width="160" height="120" fill="#252932"/>'
        + '<rect x="28" y="24" width="104" height="72" rx="6" fill="#3a4558" stroke="#8ea0b8"/>'
        + '<text x="80" y="68" fill="#dbe4f0" font-family="system-ui,sans-serif" font-size="12" text-anchor="middle">Component</text>'
        + "</svg>"
    );

export function getCatalogCategoryName(categoryId: string): string {
    return DEFAULT_CATALOG_CATEGORIES.find(category => category.id === categoryId)?.name
        ?? categoryId;
}

export function inferCatalogCategoryFromModule(module: StandModule): string {
    switch (module.type) {
        case "wall":
            return "wall";
        case "exhibitionWall":
            return "wall";
        case "cube":
        case "promoStand":
        case "corner":
            return "furniture";
        case "circularBanner":
        case "squareBanner":
            return "banner";
        default:
            return "custom";
    }
}

export function inferDefaultPriceItemId(type: ModuleType): PriceCatalogItemId | null {
    switch (type) {
        case "wall":
            return "wall-frame";
        case "exhibitionWall":
            return "wall-frame";
        case "cube":
            return "cube-frame";
        case "promoStand":
            return "promo-stand-frame";
        case "circularBanner":
        case "squareBanner":
            return "banner-frame";
        default:
            return null;
    }
}

export function formatCatalogDimensions(dimensions: CatalogDimensions): string {
    const widthCm = Math.round(dimensions.width * 100);
    const heightCm = Math.round(dimensions.height * 100);
    const depthCm = Math.round(dimensions.depth * 100);

    return `${widthCm} × ${heightCm} × ${depthCm} cm`;
}

export function isModuleCatalogSnapshot(value: unknown): value is ModuleCatalogSnapshot {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ModuleCatalogSnapshot>;

    return (
        typeof candidate.type === "string" &&
        typeof candidate.position === "object" &&
        typeof candidate.rotation === "number" &&
        typeof candidate.width === "number" &&
        typeof candidate.height === "number" &&
        typeof candidate.depth === "number"
    );
}

export function isCatalogItem(value: unknown): value is CatalogItem {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<CatalogItem>;

    return (
        typeof candidate.id === "string" &&
        typeof candidate.organizationId === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.description === "string" &&
        typeof candidate.category === "string" &&
        (candidate.thumbnail === null || typeof candidate.thumbnail === "string") &&
        isModuleCatalogSnapshot(candidate.moduleSnapshot) &&
        candidate.defaultDimensions !== null &&
        typeof candidate.defaultDimensions === "object" &&
        typeof candidate.defaultDimensions.width === "number" &&
        typeof candidate.defaultDimensions.height === "number" &&
        typeof candidate.defaultDimensions.depth === "number" &&
        (candidate.defaultPriceItemId === null || typeof candidate.defaultPriceItemId === "string") &&
        typeof candidate.createdAt === "string"
    );
}
