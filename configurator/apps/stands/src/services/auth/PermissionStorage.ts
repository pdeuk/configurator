import type {
    InvitableOrganizationRole,
    OrganizationInvite,
    OrganizationMember,
    OrganizationMembership,
    OrganizationRole
} from "@configurator/core/auth";

export interface PermissionStorage {
    getMembership(userId: string): Promise<OrganizationMembership | null>;
    listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]>;
    updateMemberRole(
        organizationId: string,
        userId: string,
        role: OrganizationRole
    ): Promise<void>;
    listOrganizationInvites(organizationId: string): Promise<OrganizationInvite[]>;
    createOrganizationInvite(
        organizationId: string,
        email: string,
        role: InvitableOrganizationRole,
        invitedBy: string
    ): Promise<void>;
    revokeOrganizationInvite(organizationId: string, inviteId: string): Promise<void>;
    removeOrganizationMember(organizationId: string, userId: string): Promise<void>;
    claimPendingOrganizationInvite(): Promise<boolean>;
}

const LOCAL_ROLE_KEY = "configurator:auth:role";
const LOCAL_INVITES_KEY = "configurator:auth:invites";

export class LocalPermissionStorage implements PermissionStorage {
    async getMembership(userId: string): Promise<OrganizationMembership | null> {
        const storedRole = localStorage.getItem(LOCAL_ROLE_KEY);
        const role: OrganizationRole =
            storedRole === "admin"
            || storedRole === "sales"
            || storedRole === "designer"
            || storedRole === "production"
                ? storedRole
                : "owner";

        return {
            organizationId: userId === "local" ? "local" : userId,
            userId,
            role
        };
    }

    async listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
        const membership = await this.getMembership(organizationId === "local" ? "local" : organizationId);

        if (!membership) {
            return [];
        }

        return [
            {
                userId: membership.userId,
                organizationId: membership.organizationId,
                email: "local@configurator.dev",
                name: "Local User",
                role: membership.role
            }
        ];
    }

    async updateMemberRole(
        _organizationId: string,
        _userId: string,
        role: OrganizationRole
    ): Promise<void> {
        localStorage.setItem(LOCAL_ROLE_KEY, role);
    }

    async listOrganizationInvites(_organizationId: string): Promise<OrganizationInvite[]> {
        const raw = localStorage.getItem(LOCAL_INVITES_KEY);

        if (!raw) {
            return [];
        }

        try {
            return JSON.parse(raw) as OrganizationInvite[];
        } catch {
            return [];
        }
    }

    async createOrganizationInvite(
        organizationId: string,
        email: string,
        role: InvitableOrganizationRole,
        invitedBy: string
    ): Promise<void> {
        const invites = await this.listOrganizationInvites(organizationId);
        const normalizedEmail = email.trim().toLowerCase();
        const nextInvite: OrganizationInvite = {
            id: crypto.randomUUID(),
            organizationId,
            email: normalizedEmail,
            role,
            invitedBy,
            createdAt: new Date().toISOString(),
            acceptedAt: null
        };

        localStorage.setItem(
            LOCAL_INVITES_KEY,
            JSON.stringify([
                ...invites.filter(invite => invite.email !== normalizedEmail),
                nextInvite
            ])
        );
    }

    async revokeOrganizationInvite(organizationId: string, inviteId: string): Promise<void> {
        const invites = await this.listOrganizationInvites(organizationId);
        localStorage.setItem(
            LOCAL_INVITES_KEY,
            JSON.stringify(invites.filter(invite => invite.id !== inviteId))
        );
    }

    async removeOrganizationMember(): Promise<void> {
        // Local mode has a single user.
    }

    async claimPendingOrganizationInvite(): Promise<boolean> {
        return false;
    }
}

export const localPermissionStorage = new LocalPermissionStorage();
