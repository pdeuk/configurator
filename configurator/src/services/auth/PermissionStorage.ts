import type {
    OrganizationMember,
    OrganizationMembership,
    OrganizationRole
} from "./RoleModel";

export interface PermissionStorage {
    getMembership(userId: string): Promise<OrganizationMembership>;
    listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]>;
    updateMemberRole(
        organizationId: string,
        userId: string,
        role: OrganizationRole
    ): Promise<void>;
}

const LOCAL_ROLE_KEY = "configurator:auth:role";

export class LocalPermissionStorage implements PermissionStorage {
    async getMembership(userId: string): Promise<OrganizationMembership> {
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
}

export const localPermissionStorage = new LocalPermissionStorage();
