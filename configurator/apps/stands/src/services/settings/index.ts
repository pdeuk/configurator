export {
    LOCAL_ORGANIZATION_ID,
    LocalSettingsStorage,
    localSettingsStorage,
    resolveOrganizationId,
    type SettingsStorage
} from "./SettingsStorage";
export { SupabaseSettingsStorage } from "./SupabaseSettingsStorage";
export {
    createDefaultCompanySettings,
    createDefaultMaterialCatalog
} from "./defaults";
export { applyMaterialCatalogToManufacturingPackage } from "./manufacturingCatalogAdapter";
export {
    buildOrganizationQuotePdfOptions,
    downloadOrganizationQuotePDF,
    generateOrganizationQuote,
    type OrganizationQuoteInput
} from "./organizationQuoteExport";
export {
    buildPriceCatalogFromMaterialCatalog,
    getOrganizationPriceCatalog
} from "./priceCatalogAdapter";
export {
    buildQuoteCompanyHeader,
    resolveQuoteTaxRate,
    resolveQuoteTerms
} from "./quoteSettingsAdapter";
export {
    SettingsService,
    getMaterialCatalog,
    getSettings,
    getSettingsContext,
    setSettingsContext,
    settingsService,
    syncSettingsContextFromCloudUser,
    updateMaterialCatalog,
    updateSettings,
    type SettingsContext
} from "./SettingsService";
export type {
    CatalogAccessory,
    CatalogFabricItem,
    CatalogFrameOption,
    CompanySettings,
    CompanySettingsUpdate,
    ManufacturingDefaults,
    ManufacturingUnits,
    MaterialCatalog,
    MaterialCatalogUpdate,
    OrganizationRef,
    QuoteDefaults
} from "./SettingsModel";
