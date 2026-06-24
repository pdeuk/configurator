import type {
    CompanySettings,
    CompanySettingsUpdate,
    MaterialCatalog,
    MaterialCatalogUpdate
} from "./SettingsModel";
import {
    createDefaultCompanySettings,
    createDefaultMaterialCatalog,
    LOCAL_ORGANIZATION_ID
} from "./defaults";

export interface SettingsStorage {
    getSettings(organizationId: string): Promise<CompanySettings>;
    updateSettings(
        organizationId: string,
        update: CompanySettingsUpdate
    ): Promise<CompanySettings>;
    getMaterialCatalog(organizationId: string): Promise<MaterialCatalog>;
    updateMaterialCatalog(
        organizationId: string,
        update: MaterialCatalogUpdate
    ): Promise<MaterialCatalog>;
}

const COMPANY_PREFIX = "configurator:settings:company:";
const CATALOG_PREFIX = "configurator:settings:catalog:";

function companyKey(organizationId: string): string {
    return `${COMPANY_PREFIX}${organizationId}`;
}

function catalogKey(organizationId: string): string {
    return `${CATALOG_PREFIX}${organizationId}`;
}

export class LocalSettingsStorage implements SettingsStorage {
    async getSettings(organizationId: string): Promise<CompanySettings> {
        const raw = localStorage.getItem(companyKey(organizationId));

        if (!raw) {
            const defaults = createDefaultCompanySettings(organizationId);
            localStorage.setItem(companyKey(organizationId), JSON.stringify(defaults));
            return defaults;
        }

        try {
            return JSON.parse(raw) as CompanySettings;
        } catch {
            const defaults = createDefaultCompanySettings(organizationId);
            localStorage.setItem(companyKey(organizationId), JSON.stringify(defaults));
            return defaults;
        }
    }

    async updateSettings(
        organizationId: string,
        update: CompanySettingsUpdate
    ): Promise<CompanySettings> {
        const current = await this.getSettings(organizationId);
        const next: CompanySettings = {
            ...current,
            ...update,
            quoteDefaults: {
                ...current.quoteDefaults,
                ...(update.quoteDefaults ?? {})
            },
            manufacturingDefaults: {
                ...current.manufacturingDefaults,
                ...(update.manufacturingDefaults ?? {})
            }
        };

        localStorage.setItem(companyKey(organizationId), JSON.stringify(next));
        return next;
    }

    async getMaterialCatalog(organizationId: string): Promise<MaterialCatalog> {
        const raw = localStorage.getItem(catalogKey(organizationId));

        if (!raw) {
            const defaults = createDefaultMaterialCatalog(organizationId);
            localStorage.setItem(catalogKey(organizationId), JSON.stringify(defaults));
            return defaults;
        }

        try {
            return JSON.parse(raw) as MaterialCatalog;
        } catch {
            const defaults = createDefaultMaterialCatalog(organizationId);
            localStorage.setItem(catalogKey(organizationId), JSON.stringify(defaults));
            return defaults;
        }
    }

    async updateMaterialCatalog(
        organizationId: string,
        update: MaterialCatalogUpdate
    ): Promise<MaterialCatalog> {
        const current = await this.getMaterialCatalog(organizationId);
        const next: MaterialCatalog = {
            ...current,
            ...update,
            fabrics: update.fabrics ?? current.fabrics,
            frameOptions: update.frameOptions ?? current.frameOptions,
            accessories: update.accessories ?? current.accessories
        };

        localStorage.setItem(catalogKey(organizationId), JSON.stringify(next));
        return next;
    }
}

export const localSettingsStorage = new LocalSettingsStorage();

export { LOCAL_ORGANIZATION_ID };
export function resolveOrganizationId(userId: string | null | undefined): string {
    return userId ?? LOCAL_ORGANIZATION_ID;
}
