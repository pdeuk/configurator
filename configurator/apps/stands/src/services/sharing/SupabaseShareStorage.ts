import { getSupabaseClient } from "@configurator/core/cloud";
import type { ProjectDocument } from "../../models/ProjectModel";
import { getCloudStorageContext } from "../cloud";
import type { SharePermissions, SharedProjectRecord } from "./ShareModel";
import type { ShareStorage } from "./ShareStorage";

interface ShareLinkRow {
    id: string;
    project_id: string;
    share_token: string;
    project_snapshot: ProjectDocument;
    permissions: Partial<SharePermissions> | null;
    created_at: string;
    expires_at: string | null;
    disabled_at: string | null;
}

async function resolveOrganizationId(userId: string): Promise<string | null> {
    const client = getSupabaseClient();

    if (!client) {
        return null;
    }

    const { data } = await client
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle();

    return (data as { organization_id: string | null } | null)?.organization_id ?? null;
}

/** Cloud-backed share storage so links resolve on any device/browser. */
export class SupabaseShareStorage implements ShareStorage {
    async saveShare(record: SharedProjectRecord): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { user } = getCloudStorageContext();

        if (!user) {
            throw new Error("Sign in to create a shareable cloud link.");
        }

        const organizationId = await resolveOrganizationId(user.id);
        const { shared, projectSnapshot } = record;

        const { error } = await client.from("share_links").insert({
            id: shared.id,
            organization_id: organizationId,
            project_id: shared.projectId,
            share_token: shared.shareToken,
            project_snapshot: projectSnapshot,
            permissions: shared.permissions,
            created_by: user.id,
            created_at: shared.createdAt,
            expires_at: shared.expiresAt
        });

        if (error) {
            throw error;
        }
    }

    async getByToken(shareToken: string): Promise<SharedProjectRecord | null> {
        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data, error } = await client.rpc("load_share_link", {
            p_token: shareToken
        });

        if (error || !data) {
            return null;
        }

        const row = data as ShareLinkRow;

        return {
            shared: {
                id: row.id,
                projectId: row.project_id,
                shareToken: row.share_token,
                createdAt: row.created_at,
                expiresAt: row.expires_at ?? "",
                permissions: {
                    view: row.permissions?.view ?? true,
                    duplicate: row.permissions?.duplicate ?? false
                }
            },
            projectSnapshot: row.project_snapshot,
            disabled: Boolean(row.disabled_at)
        };
    }

    async disableShare(shareToken: string): Promise<boolean> {
        const client = getSupabaseClient();

        if (!client) {
            return false;
        }

        const { error } = await client
            .from("share_links")
            .update({ disabled_at: new Date().toISOString() })
            .eq("share_token", shareToken);

        return !error;
    }
}

export const supabaseShareStorage = new SupabaseShareStorage();
