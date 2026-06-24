import type { BOMDocument, BOMLine } from "../bom/BOMModel";
import {
    createPriceCatalogLookup,
    mergePriceCatalogs
} from "./defaultPriceCatalog";
import type {
    PriceCatalog,
    PriceCatalogItemId,
    PriceCatalogItemOverrides,
    PricingCalculationOptions,
    QuoteDocument,
    QuoteLine,
    QuoteLinePriceOverrides
} from "./PricingModel";
import { createQuoteLineBOMReference } from "./PricingModel";
import { resolvePriceCatalogItemId } from "./resolvePriceCatalogItem";

function roundMoney(value: number): number {
    return Math.round(value * 100) / 100;
}

function resolveUnitPrice(
    bomLine: BOMLine,
    priceCatalogItemId: PriceCatalogItemId | null,
    catalogLookup: Map<string, PriceCatalog["items"][number]>,
    lineOverrides: QuoteLinePriceOverrides,
    catalogOverrides: PriceCatalogItemOverrides
): {
    unitPrice: number | null;
    pricingStatus: QuoteLine["pricingStatus"];
} {
    if (lineOverrides[bomLine.id] !== undefined) {
        return {
            unitPrice: roundMoney(lineOverrides[bomLine.id]!),
            pricingStatus: "overridden"
        };
    }

    if (!priceCatalogItemId) {
        return {
            unitPrice: null,
            pricingStatus: "missing"
        };
    }

    if (catalogOverrides[priceCatalogItemId] !== undefined) {
        return {
            unitPrice: roundMoney(catalogOverrides[priceCatalogItemId]!),
            pricingStatus: "overridden"
        };
    }

    const catalogItem = catalogLookup.get(priceCatalogItemId);

    if (!catalogItem) {
        return {
            unitPrice: null,
            pricingStatus: "missing"
        };
    }

    return {
        unitPrice: roundMoney(catalogItem.price),
        pricingStatus: "priced"
    };
}

function buildQuoteLine(
    bomLine: BOMLine,
    catalogLookup: Map<string, PriceCatalog["items"][number]>,
    lineOverrides: QuoteLinePriceOverrides,
    catalogOverrides: PriceCatalogItemOverrides
): QuoteLine {
    const priceCatalogItemId = resolvePriceCatalogItemId(bomLine);
    const { unitPrice, pricingStatus } = resolveUnitPrice(
        bomLine,
        priceCatalogItemId,
        catalogLookup,
        lineOverrides,
        catalogOverrides
    );
    const totalPrice = unitPrice === null
        ? null
        : roundMoney(unitPrice * bomLine.quantity);

    return {
        id: crypto.randomUUID(),
        bom: createQuoteLineBOMReference(bomLine),
        quantity: bomLine.quantity,
        unit: bomLine.unit,
        unitPrice,
        totalPrice,
        priceCatalogItemId,
        pricingStatus
    };
}

export class PricingService {
    calculateProjectPrice(
        bom: BOMDocument,
        priceCatalog: PriceCatalog,
        options: PricingCalculationOptions = {}
    ): QuoteDocument {
        const effectiveCatalog = mergePriceCatalogs(
            priceCatalog,
            options.customerCatalog
        );
        const catalogLookup = createPriceCatalogLookup(effectiveCatalog);
        const lineOverrides = options.lineOverrides ?? {};
        const catalogOverrides = options.catalogOverrides ?? {};
        const taxRate = options.taxRate ?? 0;
        const lines = bom.lines.map(bomLine =>
            buildQuoteLine(
                bomLine,
                catalogLookup,
                lineOverrides,
                catalogOverrides
            )
        );
        const subtotal = roundMoney(
            lines.reduce(
                (sum, line) => sum + (line.totalPrice ?? 0),
                0
            )
        );
        const tax = roundMoney(subtotal * taxRate);
        const total = roundMoney(subtotal + tax);
        const unpricedLineCount = lines.filter(
            line => line.pricingStatus === "missing"
        ).length;

        return {
            generatedAt: new Date().toISOString(),
            catalogVersion: effectiveCatalog.version,
            currency: effectiveCatalog.currency,
            subtotal,
            tax,
            total,
            lines,
            unpricedLineCount
        };
    }
}

export const pricingService = new PricingService();

export function calculateProjectPrice(
    bom: BOMDocument,
    priceCatalog: PriceCatalog,
    options?: PricingCalculationOptions
): QuoteDocument {
    return pricingService.calculateProjectPrice(bom, priceCatalog, options);
}
