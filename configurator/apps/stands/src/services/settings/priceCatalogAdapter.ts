import type { PriceCatalog } from "../pricing/PricingModel";
import {
    DEFAULT_PRICE_CATALOG_VERSION,
    defaultPriceCatalog,
    mergePriceCatalogs
} from "../pricing/defaultPriceCatalog";
import type { CompanySettings, MaterialCatalog } from "./SettingsModel";

function fabricKindToCatalogId(fabricKind: MaterialCatalog["fabrics"][number]["fabricKind"]): string {
    switch (fabricKind) {
        case "blockout":
            return "fabric-blockout";
        case "luminous":
            return "fabric-luminous";
        case "standard":
            return "fabric-standard";
    }
}

export function buildPriceCatalogFromMaterialCatalog(
    catalog: MaterialCatalog,
    settings: CompanySettings
): PriceCatalog {
    const fabricItems = catalog.fabrics.map(fabric => ({
        id: fabric.id || fabricKindToCatalogId(fabric.fabricKind),
        category: "fabric" as const,
        name: fabric.name,
        unit: fabric.unit ?? "m2",
        price: fabric.pricePerUnit ?? 0
    }));
    const frameItems = catalog.frameOptions.map(frame => ({
        id: frame.id,
        category: frame.category,
        name: frame.name,
        unit: frame.unit ?? "pcs",
        price: frame.price ?? 0
    }));
    const accessoryItems = catalog.accessories.map(accessory => ({
        id: accessory.id,
        category: "hardware" as const,
        name: accessory.name,
        unit: accessory.unit ?? "pcs",
        price: accessory.price ?? 0
    }));

    return {
        version: `${DEFAULT_PRICE_CATALOG_VERSION}-org-${catalog.organizationId}`,
        currency: settings.quoteDefaults.currency,
        items: [...fabricItems, ...frameItems, ...accessoryItems]
    };
}

export function getOrganizationPriceCatalog(
    catalog: MaterialCatalog,
    settings: CompanySettings
): PriceCatalog {
    const organizationCatalog = buildPriceCatalogFromMaterialCatalog(catalog, settings);
    return mergePriceCatalogs(defaultPriceCatalog, organizationCatalog);
}
