import { getSupabaseClient } from "@configurator/core/cloud";
import {
    isOrganizationRole,
    type InvitableOrganizationRole,
    type OrganizationInvite,
    type OrganizationMember,
    type OrganizationMembership,
    type OrganizationRole
} from "@configurator/core/auth";
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

interface OrganizationInviteRow {
    id: string;
    organization_id: string;
    email: string;
    role: string;
    invited_by: string;
    created_at: string;
    accepted_at: string | null;
}

function mapInviteRow(row: OrganizationInviteRow): OrganizationInvite {
    return {
        id: row.id,
        organizationId: row.organization_id,
        email: row.email,
        role: (isOrganizationRole(row.role) && row.role !== "owner"
            ? row.role
            : "designer") as InvitableOrganizationRole,
        invitedBy: row.invited_by,
        createdAt: row.created_at,
        acceptedAt: row.accepted_at
    };
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

    async getMembership(_userId: string): Promise<OrganizationMembership | null> {
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
            return null;
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

    async listOrganizationInvites(organizationId: string): Promise<OrganizationInvite[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from("organization_invites")
            .select("id, organization_id, email, role, invited_by, created_at, accepted_at")
            .eq("organization_id", organizationId)
            .is("accepted_at", null)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        return (data as OrganizationInviteRow[]).map(mapInviteRow);
    }

    async createOrganizationInvite(
        organizationId: string,
        email: string,
        role: InvitableOrganizationRole,
        invitedBy: string
    ): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { error } = await client
            .from("organization_invites")
            .insert({
                organization_id: organizationId,
                email: email.trim().toLowerCase(),
                role,
                invited_by: invitedBy
            });

        if (error) {
            throw error;
        }
    }

    async revokeOrganizationInvite(organizationId: string, inviteId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { error } = await client
            .from("organization_invites")
            .delete()
            .eq("organization_id", organizationId)
            .eq("id", inviteId);

        if (error) {
            throw error;
        }
    }

    async removeOrganizationMember(organizationId: string, userId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { error } = await client
            .from("organization_members")
            .delete()
            .eq("organization_id", organizationId)
            .eq("user_id", userId);

        if (error) {
            throw error;
        }
    }

    async claimPendingOrganizationInvite(): Promise<boolean> {
        const client = getSupabaseClient();

        if (!client) {
            return false;
        }

        const { data, error } = await client.rpc("claim_pending_organization_invite");

        if (error) {
            throw error;
        }

        return Boolean(data);
    }
}
