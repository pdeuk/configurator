import type { PriceCatalog } from "./PricingModel";

export const DEFAULT_PRICE_CATALOG_VERSION = "2026.1";

export const defaultPriceCatalog: PriceCatalog = {
    version: DEFAULT_PRICE_CATALOG_VERSION,
    currency: "EUR",
    items: [
        {
            id: "wall-frame",
            category: "frame",
            name: "Wall Frame",
            unit: "pcs",
            price: 185
        },
        {
            id: "fabric-standard",
            category: "fabric",
            name: "Printed Fabric",
            unit: "m2",
            price: 42
        },
        {
            id: "fabric-blockout",
            category: "fabric",
            name: "Blockout Fabric",
            unit: "m2",
            price: 58
        },
        {
            id: "fabric-luminous",
            category: "fabric",
            name: "Luminous Fabric",
            unit: "m2",
            price: 96
        },
        {
            id: "cube-frame",
            category: "panel",
            name: "Cube Frame",
            unit: "pcs",
            price: 220
        },
        {
            id: "promo-stand-frame",
            category: "frame",
            name: "Promo Stand Frame",
            unit: "pcs",
            price: 340
        },
        {
            id: "melamine",
            category: "melamine",
            name: "Melamine Panel",
            unit: "pcs",
            price: 75
        },
        {
            id: "shelf",
            category: "shelf",
            name: "Melamine Shelf",
            unit: "pcs",
            price: 45
        },
        {
            id: "door",
            category: "door",
            name: "Back Door",
            unit: "pcs",
            price: 55
        },
        {
            id: "banner-frame",
            category: "banner",
            name: "Banner Frame",
            unit: "pcs",
            price: 260
        }
    ]
};

export function createPriceCatalogLookup(
    catalog: PriceCatalog
): Map<string, PriceCatalog["items"][number]> {
    return new Map(catalog.items.map(item => [item.id, item]));
}

export function mergePriceCatalogs(
    baseCatalog: PriceCatalog,
    customerCatalog?: PriceCatalog | null
): PriceCatalog {
    if (!customerCatalog) {
        return baseCatalog;
    }

    const mergedItems = new Map(baseCatalog.items.map(item => [item.id, item]));

    for (const item of customerCatalog.items) {
        mergedItems.set(item.id, item);
    }

    return {
        version: customerCatalog.version || baseCatalog.version,
        currency: customerCatalog.currency || baseCatalog.currency,
        items: [...mergedItems.values()]
    };
}
