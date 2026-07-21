export type OrganizationRole =
    | "owner"
    | "admin"
    | "sales"
    | "designer"
    | "production";

export interface Permission {
    projects: {
        create: boolean;
        edit: boolean;
        delete: boolean;
        view: boolean;
    };
    quotes: {
        create: boolean;
        export: boolean;
    };
    manufacturing: {
        view: boolean;
        export: boolean;
    };
    settings: {
        edit: boolean;
    };
    artwork: {
        download_original: boolean;
    };
}

export type PermissionAction =
    | "projects.create"
    | "projects.edit"
    | "projects.delete"
    | "projects.view"
    | "quotes.create"
    | "quotes.export"
    | "manufacturing.view"
    | "manufacturing.export"
    | "settings.edit"
    | "artwork.download_original";

export interface OrganizationMember {
    userId: string;
    organizationId: string;
    email: string;
    name: string;
    role: OrganizationRole;
}

export interface OrganizationMembership {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
}

const FULL_PERMISSIONS: Permission = {
    projects: { create: true, edit: true, delete: true, view: true },
    quotes: { create: true, export: true },
    manufacturing: { view: true, export: true },
    settings: { edit: true },
    artwork: { download_original: true }
};

const ROLE_PERMISSIONS: Record<OrganizationRole, Permission> = {
    owner: FULL_PERMISSIONS,
    admin: FULL_PERMISSIONS,
    sales: {
        projects: { create: true, edit: true, delete: true, view: true },
        quotes: { create: true, export: true },
        manufacturing: { view: false, export: false },
        settings: { edit: false },
        artwork: { download_original: true }
    },
    designer: {
        projects: { create: true, edit: true, delete: true, view: true },
        quotes: { create: false, export: false },
        manufacturing: { view: false, export: false },
        settings: { edit: false },
        artwork: { download_original: true }
    },
    production: {
        projects: { create: false, edit: false, delete: false, view: true },
        quotes: { create: false, export: false },
        manufacturing: { view: true, export: true },
        settings: { edit: false },
        artwork: { download_original: true }
    }
};

export const ORGANIZATION_ROLES: OrganizationRole[] = [
    "owner",
    "admin",
    "sales",
    "designer",
    "production"
];

export type InvitableOrganizationRole = Exclude<OrganizationRole, "owner">;

export const INVITABLE_ORGANIZATION_ROLES: InvitableOrganizationRole[] = [
    "admin",
    "sales",
    "designer",
    "production"
];

export interface OrganizationInvite {
    id: string;
    organizationId: string;
    email: string;
    role: InvitableOrganizationRole;
    invitedBy: string;
    createdAt: string;
    acceptedAt: string | null;
}

export function isOrganizationRole(value: string): value is OrganizationRole {
    return ORGANIZATION_ROLES.includes(value as OrganizationRole);
}

export function getPermissionsForRole(role: OrganizationRole): Permission {
    return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(
    role: OrganizationRole,
    action: PermissionAction
): boolean {
    const [resource, capability] = action.split(".") as [
        keyof Permission,
        string
    ];
    const permissions = getPermissionsForRole(role);
    const section = permissions[resource];

    return Boolean(section[capability as keyof typeof section]);
}

export function canManageOrganizationUsers(role: OrganizationRole): boolean {
    return role === "owner" || role === "admin";
}

export function formatOrganizationRole(role: OrganizationRole): string {
    return role.charAt(0).toUpperCase() + role.slice(1);
}
