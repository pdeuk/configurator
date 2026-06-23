import { getSupabaseClient } from "../cloud/SupabaseClient";
import {
    isOrganizationRole,
    type OrganizationMember,
    type OrganizationMembership,
    type OrganizationRole
} from "./RoleModel";
import type { PermissionStorage } from "./PermissionStorage";

interface OrganizationMemberRow {
    organization_id: string;
    user_id: string;
    role: string;
    profiles:
        | {
            email: string;
            display_name: string | null;
        }
        | {
            email: string;
            display_name: string | null;
        }[]
        | null;
}

async function resolveOrganizationId(userId: string): Promise<string> {
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

function readProfile(
    profiles: OrganizationMemberRow["profiles"]
): { email: string; display_name: string | null } | null {
    if (!profiles) {
        return null;
    }

    if (Array.isArray(profiles)) {
        return profiles[0] ?? null;
    }

    return profiles;
}

function mapMemberRow(row: OrganizationMemberRow): OrganizationMember {
    const profile = readProfile(row.profiles);
    const email = profile?.email ?? "";
    const displayName = profile?.display_name?.trim();

    return {
        userId: row.user_id,
        organizationId: row.organization_id,
        email,
        name: displayName || email.split("@")[0] || email,
        role: isOrganizationRole(row.role) ? row.role : "designer"
    };
}

export class SupabasePermissionStorage implements PermissionStorage {
    private readonly userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    async getMembership(_userId: string): Promise<OrganizationMembership> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await resolveOrganizationId(this.userId);
        const { data, error } = await client
            .from("organization_members")
            .select("organization_id, user_id, role")
            .eq("user_id", this.userId)
            .eq("organization_id", organizationId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return {
                organizationId,
                userId: this.userId,
                role: "owner"
            };
        }

        const role = isOrganizationRole(data.role) ? data.role : "designer";

        return {
            organizationId: data.organization_id,
            userId: data.user_id,
            role
        };
    }

    async listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from("organization_members")
            .select("organization_id, user_id, role, profiles(email, display_name)")
            .eq("organization_id", organizationId)
            .order("role", { ascending: true });

        if (error) {
            throw error;
        }

        return (data as OrganizationMemberRow[]).map(mapMemberRow);
    }

    async updateMemberRole(
        organizationId: string,
        userId: string,
        role: OrganizationRole
    ): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { error } = await client
            .from("organization_members")
            .update({ role })
            .eq("organization_id", organizationId)
            .eq("user_id", userId);

        if (error) {
            throw error;
        }
    }
}
