import { getSupabaseClient } from "@configurator/core/cloud";
import type {
    CompanySettings,
    CompanySettingsUpdate,
    MaterialCatalog,
    MaterialCatalogUpdate
} from "./SettingsModel";
import {
    createDefaultCompanySettings,
    createDefaultMaterialCatalog
} from "./defaults";
import type { SettingsStorage } from "./SettingsStorage";

interface CompanySettingsRow {
    id: string;
    organization_id: string;
    settings_json: CompanySettings;
    updated_at: string;
}

interface MaterialCatalogRow {
    id: string;
    organization_id: string;
    catalog_json: MaterialCatalog;
    updated_at: string;
}

async function resolveCloudOrganizationId(userId: string): Promise<string> {
    const client = getSupabaseClient();

    if (!client) {
        return userId;
    }

    const { data, error } = await client
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data as { organization_id: string | null } | null)?.organization_id ?? userId;
}

export class SupabaseSettingsStorage implements SettingsStorage {
    private readonly userId: string;
    private organizationIdPromise: Promise<string> | null = null;

    constructor(userId: string) {
        this.userId = userId;
    }

    private getOrganizationId(): Promise<string> {
        if (!this.organizationIdPromise) {
            this.organizationIdPromise = resolveCloudOrganizationId(this.userId);
        }

        return this.organizationIdPromise;
    }

    async getSettings(_organizationId: string): Promise<CompanySettings> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("company_settings")
            .select("*")
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            const defaults = createDefaultCompanySettings(organizationId);
            await this.updateSettings(organizationId, defaults);
            return defaults;
        }

        return (data as CompanySettingsRow).settings_json;
    }

    async updateSettings(
        _organizationId: string,
        update: CompanySettingsUpdate
    ): Promise<CompanySettings> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const current = await this.getSettings(organizationId);
        const next: CompanySettings = {
            ...current,
            ...update,
            organizationId,
            quoteDefaults: {
                ...current.quoteDefaults,
                ...(update.quoteDefaults ?? {})
            },
            manufacturingDefaults: {
                ...current.manufacturingDefaults,
                ...(update.manufacturingDefaults ?? {})
            }
        };
        const updatedAt = new Date().toISOString();
        const row: CompanySettingsRow = {
            id: current.id,
            organization_id: organizationId,
            settings_json: next,
            updated_at: updatedAt
        };

        const { error } = await client
            .from("company_settings")
            .upsert(row, { onConflict: "organization_id" });

        if (error) {
            throw error;
        }

        return next;
    }

    async getMaterialCatalog(_organizationId: string): Promise<MaterialCatalog> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("material_catalogs")
            .select("*")
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            const defaults = createDefaultMaterialCatalog(organizationId);
            await this.updateMaterialCatalog(organizationId, defaults);
            return defaults;
        }

        return (data as MaterialCatalogRow).catalog_json;
    }

    async updateMaterialCatalog(
        _organizationId: string,
        update: MaterialCatalogUpdate
    ): Promise<MaterialCatalog> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const current = await this.getMaterialCatalog(organizationId);
        const next: MaterialCatalog = {
            ...current,
            ...update,
            organizationId,
            fabrics: update.fabrics ?? current.fabrics,
            frameOptions: update.frameOptions ?? current.frameOptions,
            accessories: update.accessories ?? current.accessories
        };
        const updatedAt = new Date().toISOString();
        const row: MaterialCatalogRow = {
            id: current.id,
            organization_id: organizationId,
            catalog_json: next,
            updated_at: updatedAt
        };

        const { error } = await client
            .from("material_catalogs")
            .upsert(row, { onConflict: "organization_id" });

        if (error) {
            throw error;
        }

        return next;
    }
}
