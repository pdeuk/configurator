import type { ProjectDocument } from "../../models/ProjectModel";
import type { GenerateQuoteInput } from "../quotes/QuoteModel";
import { generateQuote } from "../quotes/QuoteService";
import type { GenerateQuoteOptions } from "../quotes/QuoteService";
import { downloadQuotePDF, type DownloadQuotePdfOptions } from "../quotes/quotePdfExport";
import { assetService } from "../assets/AssetService";
import { getOrganizationPriceCatalog } from "./priceCatalogAdapter";
import {
    buildQuoteCompanyHeader,
    resolveQuoteTaxRate,
    resolveQuoteTerms
} from "./quoteSettingsAdapter";
import type { CompanySettings, MaterialCatalog } from "./SettingsModel";

export interface OrganizationQuoteInput extends GenerateQuoteInput {
    pricingOptions?: GenerateQuoteOptions["pricingOptions"];
}

export function generateOrganizationQuote(
    projectDocument: ProjectDocument,
    settings: CompanySettings,
    materialCatalog: MaterialCatalog,
    input: OrganizationQuoteInput = {}
): ReturnType<typeof generateQuote> {
    const priceCatalog = getOrganizationPriceCatalog(materialCatalog, settings);

    return generateQuote(projectDocument, {
        ...input,
        terms: resolveQuoteTerms(settings, input.terms),
        priceCatalog,
        pricingOptions: {
            taxRate: resolveQuoteTaxRate(settings, input.pricingOptions?.taxRate),
            ...input.pricingOptions
        }
    });
}

export async function buildOrganizationQuotePdfOptions(
    settings: CompanySettings
): Promise<Pick<DownloadQuotePdfOptions, "companyHeader" | "logoUrl">> {
    const companyHeader = buildQuoteCompanyHeader(settings);
    let logoUrl: string | null = null;

    if (settings.logoAssetId) {
        logoUrl = await assetService.createObjectUrl(settings.logoAssetId);
    }

    return {
        companyHeader,
        ...(logoUrl ? { logoUrl } : {})
    };
}

export async function downloadOrganizationQuotePDF(
    projectDocument: ProjectDocument,
    settings: CompanySettings,
    materialCatalog: MaterialCatalog,
    input: OrganizationQuoteInput = {},
    options: Omit<DownloadQuotePdfOptions, "companyHeader" | "logoUrl"> = {}
): Promise<void> {
    const quote = generateOrganizationQuote(
        projectDocument,
        settings,
        materialCatalog,
        input
    );
    const branding = await buildOrganizationQuotePdfOptions(settings);

    await downloadQuotePDF(quote, {
        ...options,
        projectDocument,
        ...branding
    });
}
