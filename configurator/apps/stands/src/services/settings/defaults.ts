import { DEFAULT_QUOTE_TERMS } from "../quotes/QuoteModel";
import type {
    CompanySettings,
    MaterialCatalog
} from "./SettingsModel";

export const LOCAL_ORGANIZATION_ID = "local";

export function createDefaultCompanySettings(organizationId: string): CompanySettings {
    return {
        id: crypto.randomUUID(),
        organizationId,
        companyName: "Your Company Name",
        logoAssetId: null,
        address: "Street Address\nCity, Country",
        email: "quotes@company.com",
        phone: "+00 000 000 000",
        quoteDefaults: {
            currency: "EUR",
            taxRate: 0.21,
            terms: DEFAULT_QUOTE_TERMS
        },
        manufacturingDefaults: {
            units: "metric",
            notes: ""
        }
    };
}

export function createDefaultMaterialCatalog(organizationId: string): MaterialCatalog {
    return {
        id: crypto.randomUUID(),
        organizationId,
        fabrics: [
            {
                id: "fabric-standard",
                name: "Printed Fabric",
                fabricKind: "standard",
                unit: "m2",
                pricePerUnit: 42
            },
            {
                id: "fabric-blockout",
                name: "Blockout Fabric",
                fabricKind: "blockout",
                unit: "m2",
                pricePerUnit: 58
            },
            {
                id: "fabric-luminous",
                name: "Luminous Fabric",
                fabricKind: "luminous",
                unit: "m2",
                pricePerUnit: 96
            }
        ],
        frameOptions: [
            {
                id: "wall-frame",
                name: "Wall Frame",
                category: "frame",
                unit: "pcs",
                price: 185
            },
            {
                id: "cube-frame",
                name: "Cube Frame",
                category: "panel",
                unit: "pcs",
                price: 220
            },
            {
                id: "promo-stand-frame",
                name: "Promo Stand Frame",
                category: "frame",
                unit: "pcs",
                price: 340
            },
            {
                id: "melamine",
                name: "Melamine Panel",
                category: "melamine",
                unit: "pcs",
                price: 75
            },
            {
                id: "shelf",
                name: "Melamine Shelf",
                category: "shelf",
                unit: "pcs",
                price: 45
            },
            {
                id: "door",
                name: "Back Door",
                category: "door",
                unit: "pcs",
                price: 55
            },
            {
                id: "banner-frame",
                name: "Banner Frame",
                category: "banner",
                unit: "pcs",
                price: 260
            }
        ],
        accessories: []
    };
}
