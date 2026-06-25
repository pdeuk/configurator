import type { AuthUser } from "@configurator/core/cloud";
import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { isBrowserOnline, isSupabaseConfigured } from "@configurator/core/cloud";
import { LOCAL_ORGANIZATION_ID } from "../settings/SettingsStorage";
import {
    canManageOrganizationUsers,
    roleHasPermission,
    type InvitableOrganizationRole,
    type OrganizationInvite,
    type OrganizationMember,
    type OrganizationMembership,
    type OrganizationRole,
    type PermissionAction
} from "@configurator/core/auth";
import {
    localPermissionStorage,
    type PermissionStorage
} from "./PermissionStorage";
import { SupabasePermissionStorage } from "./SupabasePermissionStorage";

let cachedMembership: OrganizationMembership | null = null;
let cachedUserId: string | null = null;

function resolveActiveUserId(): string {
    const { user } = getCloudStorageContext();
    return user?.id ?? LOCAL_ORGANIZATION_ID;
}

function canUseCloudPermissions(): boolean {
    const { user } = getCloudStorageContext();
    return Boolean(isSupabaseConfigured() && user && isBrowserOnline());
}

function getStorage(): PermissionStorage {
    const { user } = getCloudStorageContext();

    if (canUseCloudPermissions() && user) {
        return new SupabasePermissionStorage(user.id);
    }

    return localPermissionStorage;
}

export class PermissionService {
    async getStaffMembership(user?: AuthUser | null): Promise<OrganizationMembership | null> {
        const userId = user?.id ?? resolveActiveUserId();

        if (cachedMembership && cachedUserId === userId) {
            return cachedMembership;
        }

        const membership = await getStorage().getMembership(userId);

        if (membership) {
            cachedMembership = membership;
            cachedUserId = userId;
        }

        return membership;
    }

    async getUserRole(user?: AuthUser | null): Promise<OrganizationRole> {
        const membership = await this.getMembership(user);
        return membership.role;
    }

    async getMembership(user?: AuthUser | null): Promise<OrganizationMembership> {
        const membership = await this.getStaffMembership(user);

        if (!membership) {
            throw new Error("No organization membership found for this account.");
        }

        return membership;
    }

    can(action: PermissionAction, role?: OrganizationRole): boolean {
        const effectiveRole = role ?? cachedMembership?.role;

        if (!effectiveRole) {
            return false;
        }

        return roleHasPermission(effectiveRole, action);
    }

    canManageUsers(role?: OrganizationRole): boolean {
        const effectiveRole = role ?? cachedMembership?.role;

        if (!effectiveRole) {
            return false;
        }

        return canManageOrganizationUsers(effectiveRole);
    }

    async listOrganizationMembers(): Promise<OrganizationMember[]> {
        const membership = await this.getMembership();
        return getStorage().listOrganizationMembers(membership.organizationId);
    }

    async updateMemberRole(
        userId: string,
        role: OrganizationRole
    ): Promise<void> {
        const membership = await this.getMembership();

        if (!canManageOrganizationUsers(membership.role)) {
            throw new Error("You do not have permission to manage users.");
        }

        await getStorage().updateMemberRole(membership.organizationId, userId, role);

        if (userId === membership.userId) {
            cachedMembership = { ...membership, role };
        }

        window.dispatchEvent(new Event("configurator:permissions-updated"));
    }

    async listOrganizationInvites(): Promise<OrganizationInvite[]> {
        const membership = await this.getMembership();
        return getStorage().listOrganizationInvites(membership.organizationId);
    }

    async createOrganizationInvite(
        email: string,
        role: InvitableOrganizationRole
    ): Promise<void> {
        const membership = await this.getMembership();

        if (!canManageOrganizationUsers(membership.role)) {
            throw new Error("You do not have permission to invite users.");
        }

        await getStorage().createOrganizationInvite(
            membership.organizationId,
            email,
            role,
            membership.userId
        );

        window.dispatchEvent(new Event("configurator:permissions-updated"));
    }

    async revokeOrganizationInvite(inviteId: string): Promise<void> {
        const membership = await this.getMembership();

        if (!canManageOrganizationUsers(membership.role)) {
            throw new Error("You do not have permission to manage invites.");
        }

        await getStorage().revokeOrganizationInvite(membership.organizationId, inviteId);
        window.dispatchEvent(new Event("configurator:permissions-updated"));
    }

    async removeOrganizationMember(userId: string): Promise<void> {
        const membership = await this.getMembership();

        if (!canManageOrganizationUsers(membership.role)) {
            throw new Error("You do not have permission to remove users.");
        }

        if (userId === membership.userId) {
            throw new Error("You cannot remove yourself.");
        }

        await getStorage().removeOrganizationMember(membership.organizationId, userId);
        window.dispatchEvent(new Event("configurator:permissions-updated"));
    }

    async claimPendingOrganizationInvite(): Promise<boolean> {
        const claimed = await getStorage().claimPendingOrganizationInvite();

        if (claimed) {
            cachedMembership = null;
            cachedUserId = null;
            window.dispatchEvent(new Event("configurator:permissions-updated"));
        }

        return claimed;
    }

    clearCache(): void {
        cachedMembership = null;
        cachedUserId = null;
    }
}

export const permissionService = new PermissionService();

export function getUserRole(user?: AuthUser | null): Promise<OrganizationRole> {
    return permissionService.getUserRole(user);
}

export function can(action: PermissionAction, role?: OrganizationRole): boolean {
    return permissionService.can(action, role);
}

export function clearPermissionCache(): void {
    permissionService.clearCache();
}
