import type { AuthUser } from "../cloud/CloudAuthService";
import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { isSupabaseConfigured } from "../cloud/SupabaseClient";
import { isBrowserOnline } from "../cloud/syncStatus";
import { LOCAL_ORGANIZATION_ID } from "../settings/SettingsStorage";
import {
    canManageOrganizationUsers,
    roleHasPermission,
    type OrganizationMember,
    type OrganizationMembership,
    type OrganizationRole,
    type PermissionAction
} from "./RoleModel";
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
    async getUserRole(user?: AuthUser | null): Promise<OrganizationRole> {
        const membership = await this.getMembership(user);
        return membership.role;
    }

    async getMembership(user?: AuthUser | null): Promise<OrganizationMembership> {
        const userId = user?.id ?? resolveActiveUserId();

        if (cachedMembership && cachedUserId === userId) {
            return cachedMembership;
        }

        const membership = await getStorage().getMembership(userId);
        cachedMembership = membership;
        cachedUserId = userId;
        return membership;
    }

    can(action: PermissionAction, role?: OrganizationRole): boolean {
        const effectiveRole = role ?? cachedMembership?.role ?? "owner";
        return roleHasPermission(effectiveRole, action);
    }

    canManageUsers(role?: OrganizationRole): boolean {
        const effectiveRole = role ?? cachedMembership?.role ?? "owner";
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
