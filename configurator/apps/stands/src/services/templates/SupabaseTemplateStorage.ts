import { getSupabaseClient } from "@configurator/core/cloud";
import type { StandTemplate } from "./TemplateModel";
import { isStandTemplate } from "./TemplateModel";
import type { TemplateStorage } from "./TemplateStorage";

interface TemplateRow {
    id: string;
    organization_id: string;
    name: string;
    description: string;
    category: string;
    thumbnail_url: string | null;
    project_snapshot: StandTemplate["projectSnapshot"];
    created_at: string;
    created_by: string | null;
}

function rowToTemplate(row: TemplateRow): StandTemplate {
    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        description: row.description,
        category: row.category,
        thumbnailUrl: row.thumbnail_url,
        projectSnapshot: row.project_snapshot,
        createdAt: row.created_at,
        createdBy: row.created_by
    };
}

function templateToRow(template: StandTemplate): TemplateRow {
    return {
        id: template.id,
        organization_id: template.organizationId,
        name: template.name,
        description: template.description,
        category: template.category,
        thumbnail_url: template.thumbnailUrl,
        project_snapshot: template.projectSnapshot,
        created_at: template.createdAt,
        created_by: template.createdBy
    };
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

export class SupabaseTemplateStorage implements TemplateStorage {
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

    async listTemplates(_organizationId: string): Promise<StandTemplate[]> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("templates")
            .select("*")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        return ((data ?? []) as TemplateRow[]).map(rowToTemplate);
    }

    async getTemplate(_organizationId: string, templateId: string): Promise<StandTemplate | null> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("templates")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("id", templateId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        const template = rowToTemplate(data as TemplateRow);

        return isStandTemplate(template) ? template : null;
    }

    async saveTemplate(template: StandTemplate): Promise<StandTemplate> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const payload = templateToRow({
            ...template,
            organizationId
        });

        const { data, error } = await client
            .from("templates")
            .upsert(payload)
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        return rowToTemplate(data as TemplateRow);
    }

    async deleteTemplate(_organizationId: string, templateId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { error } = await client
            .from("templates")
            .delete()
            .eq("organization_id", organizationId)
            .eq("id", templateId);

        if (error) {
            throw error;
        }
    }
}
