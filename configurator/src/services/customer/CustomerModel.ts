import type { ProjectDocument } from "../../models/ProjectModel";

export interface CustomerProjectPermissions {
    view: boolean;
    comment: boolean;
    approve: boolean;
}

export interface Customer {
    id: string;
    organizationId: string;
    name: string;
    email: string;
    company: string;
    createdAt: string;
    /** Linked Supabase auth user for portal login. */
    authUserId?: string | null;
}

export interface CustomerProjectAccess {
    customerId: string;
    projectId: ProjectDocument["id"];
    permissions: CustomerProjectPermissions;
}

export interface CreateCustomerInput {
    name: string;
    email: string;
    company?: string;
    /** Local portal login password (stored separately from customer record). */
    portalPassword?: string;
}

export interface AssignProjectToCustomerInput {
    customerId: string;
    projectId: ProjectDocument["id"];
    permissions?: Partial<CustomerProjectPermissions>;
}

export interface CustomerProjectSummary {
    projectId: ProjectDocument["id"];
    projectName: string;
    permissions: CustomerProjectPermissions;
    reviewStatus: string | null;
    updatedAt: string | null;
}

export const DEFAULT_CUSTOMER_PROJECT_PERMISSIONS: CustomerProjectPermissions = {
    view: true,
    comment: true,
    approve: true
};

export function normalizeCustomerProjectPermissions(
    permissions: Partial<CustomerProjectPermissions> | undefined
): CustomerProjectPermissions {
    return {
        view: permissions?.view ?? DEFAULT_CUSTOMER_PROJECT_PERMISSIONS.view,
        comment: permissions?.comment ?? DEFAULT_CUSTOMER_PROJECT_PERMISSIONS.comment,
        approve: permissions?.approve ?? DEFAULT_CUSTOMER_PROJECT_PERMISSIONS.approve
    };
}

export function isCustomer(value: unknown): value is Customer {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<Customer>;

    return (
        typeof candidate.id === "string" &&
        typeof candidate.organizationId === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.email === "string" &&
        typeof candidate.company === "string" &&
        typeof candidate.createdAt === "string"
    );
}

export function isCustomerProjectAccess(value: unknown): value is CustomerProjectAccess {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<CustomerProjectAccess>;

    return (
        typeof candidate.customerId === "string" &&
        typeof candidate.projectId === "string" &&
        candidate.permissions !== null &&
        typeof candidate.permissions === "object" &&
        typeof candidate.permissions.view === "boolean" &&
        typeof candidate.permissions.comment === "boolean" &&
        typeof candidate.permissions.approve === "boolean"
    );
}
