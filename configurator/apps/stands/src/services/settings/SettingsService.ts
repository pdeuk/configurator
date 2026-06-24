import type { AuthUser } from "@configurator/core/cloud";
import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { isSupabaseConfigured } from "@configurator/core/cloud";
import { isBrowserOnline } from "@configurator/core/cloud";
import type { PriceCatalog } from "../pricing/PricingModel";
import {
    localSettingsStorage,
    resolveOrganizationId,
    type SettingsStorage
} from "./SettingsStorage";
import { SupabaseSettingsStorage } from "./SupabaseSettingsStorage";
import type {
    CompanySettings,
    CompanySettingsUpdate,
    MaterialCatalog,
    MaterialCatalogUpdate
} from "./SettingsModel";
import { getOrganizationPriceCatalog } from "./priceCatalogAdapter";

export interface SettingsContext {
    organizationId: string;
    user: AuthUser | null;
}

let settingsContext: SettingsContext = {
    organizationId: resolveOrganizationId(null),
    user: null
};

export function setSettingsContext(context: SettingsContext): void {
    settingsContext = context;
}

export function getSettingsContext(): SettingsContext {
    return settingsContext;
}

function canUseCloudSettings(): boolean {
    const { user } = getCloudStorageContext();
    return Boolean(isSupabaseConfigured() && user && isBrowserOnline());
}

function getStorage(): SettingsStorage {
    const { user } = getCloudStorageContext();

    if (canUseCloudSettings() && user) {
        return new SupabaseSettingsStorage(user.id);
    }

    return localSettingsStorage;
}

function getActiveOrganizationId(): string {
    return settingsContext.organizationId;
}

export class SettingsService {
    async getSettings(): Promise<CompanySettings> {
        return getStorage().getSettings(getActiveOrganizationId());
    }

    async updateSettings(update: CompanySettingsUpdate): Promise<CompanySettings> {
        const next = await getStorage().updateSettings(getActiveOrganizationId(), update);
        window.dispatchEvent(new Event("configurator:settings-updated"));
        return next;
    }

    async getMaterialCatalog(): Promise<MaterialCatalog> {
        return getStorage().getMaterialCatalog(getActiveOrganizationId());
    }

    async updateMaterialCatalog(update: MaterialCatalogUpdate): Promise<MaterialCatalog> {
        const next = await getStorage().updateMaterialCatalog(getActiveOrganizationId(), update);
        window.dispatchEvent(new Event("configurator:settings-updated"));
        return next;
    }

    async getOrganizationPriceCatalog(): Promise<PriceCatalog> {
        const [settings, catalog] = await Promise.all([
            this.getSettings(),
            this.getMaterialCatalog()
        ]);

        return getOrganizationPriceCatalog(catalog, settings);
    }
}

export const settingsService = new SettingsService();

export function getSettings(): Promise<CompanySettings> {
    return settingsService.getSettings();
}

export function updateSettings(update: CompanySettingsUpdate): Promise<CompanySettings> {
    return settingsService.updateSettings(update);
}

export function getMaterialCatalog(): Promise<MaterialCatalog> {
    return settingsService.getMaterialCatalog();
}

export function updateMaterialCatalog(update: MaterialCatalogUpdate): Promise<MaterialCatalog> {
    return settingsService.updateMaterialCatalog(update);
}

export function syncSettingsContextFromCloudUser(user: AuthUser | null): void {
    setSettingsContext({
        organizationId: resolveOrganizationId(user?.id ?? null),
        user
    });
}
