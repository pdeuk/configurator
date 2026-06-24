import type { ProjectDocument } from "../../models/ProjectModel";
import { calculateProjectBOM } from "../bom";
import {
    calculateProjectPrice,
    defaultPriceCatalog,
    type PriceCatalog,
    type PricingCalculationOptions
} from "../pricing";
import type {
    GenerateQuoteInput,
    QuoteCustomer,
    QuoteDocument
} from "./QuoteModel";
import {
    createEmptyQuoteCustomer,
    DEFAULT_QUOTE_NOTES,
    DEFAULT_QUOTE_TERMS
} from "./QuoteModel";

export interface GenerateQuoteOptions extends GenerateQuoteInput {
    priceCatalog?: PriceCatalog;
    pricingOptions?: PricingCalculationOptions;
}

function createQuoteNumber(date = new Date()): string {
    const year = date.getFullYear();
    const suffix = date.toISOString().slice(0, 10).replace(/-/g, "")
        + String(date.getHours()).padStart(2, "0")
        + String(date.getMinutes()).padStart(2, "0");

    return `Q-${year}-${suffix}`;
}

export class QuoteService {
    generateQuote(
        projectDocument: ProjectDocument,
        input: GenerateQuoteOptions = {}
    ): QuoteDocument {
        const createdAt = new Date().toISOString();
        const bom = calculateProjectBOM(projectDocument);
        const pricing = calculateProjectPrice(
            bom,
            input.priceCatalog ?? defaultPriceCatalog,
            input.pricingOptions
        );
        const customer = this.resolveCustomer(input.customer);

        return {
            id: crypto.randomUUID(),
            quoteNumber: input.quoteNumber ?? createQuoteNumber(new Date(createdAt)),
            createdAt,
            customer,
            project: {
                name: input.projectName ?? projectDocument.name,
                previewImages: [...(input.previewImages ?? [])]
            },
            bom,
            pricing,
            notes: input.notes ?? DEFAULT_QUOTE_NOTES,
            terms: input.terms ?? DEFAULT_QUOTE_TERMS
        };
    }

    private resolveCustomer(overrides: Partial<QuoteCustomer> | undefined): QuoteCustomer {
        return createEmptyQuoteCustomer(overrides);
    }
}

export const quoteService = new QuoteService();

export function generateQuote(
    projectDocument: ProjectDocument,
    input: GenerateQuoteOptions = {}
): QuoteDocument {
    return quoteService.generateQuote(projectDocument, input);
}
