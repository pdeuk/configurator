import type { QuoteCompanyHeader } from "../quotes/QuoteModel";
import type { CompanySettings } from "./SettingsModel";

export function buildQuoteCompanyHeader(settings: CompanySettings): QuoteCompanyHeader {
    return {
        name: settings.companyName,
        addressLines: settings.address
            .split("\n")
            .map(line => line.trim())
            .filter(Boolean),
        email: settings.email,
        phone: settings.phone
    };
}

export function resolveQuoteTerms(settings: CompanySettings, override?: string): string {
    return override?.trim() || settings.quoteDefaults.terms;
}

export function resolveQuoteTaxRate(settings: CompanySettings, override?: number): number {
    return override ?? settings.quoteDefaults.taxRate;
}
