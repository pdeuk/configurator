import { getSupabaseClient } from "@configurator/core/cloud";
import type {
    Customer,
    CustomerProjectAccess,
    CustomerProjectPermissions
} from "./CustomerModel";
import {
    isCustomerProjectAccess,
    normalizeCustomerProjectPermissions
} from "./CustomerModel";
import type { CustomerStorage } from "./CustomerStorage";

interface CustomerRow {
    id: string;
    organization_id: string;
    name: string;
    email: string;
    company: string;
    auth_user_id: string | null;
    created_at: string;
}

interface AccessRow {
    customer_id: string;
    project_id: string;
    permissions: CustomerProjectPermissions;
}

function rowToCustomer(row: CustomerRow): Customer {
    return {
        id: row.id,
        organizationId: row.organization_id,
        name: row.name,
        email: row.email,
        company: row.company,
        authUserId: row.auth_user_id,
        createdAt: row.created_at
    };
}

function customerToRow(customer: Customer): CustomerRow {
    return {
        id: customer.id,
        organization_id: customer.organizationId,
        name: customer.name,
        email: customer.email,
        company: customer.company,
        auth_user_id: customer.authUserId ?? null,
        created_at: customer.createdAt
    };
}

function rowToAccess(row: AccessRow): CustomerProjectAccess {
    return {
        customerId: row.customer_id,
        projectId: row.project_id,
        permissions: normalizeCustomerProjectPermissions(row.permissions)
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

export class SupabaseCustomerStorage implements CustomerStorage {
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

    async listCustomers(_organizationId: string): Promise<Customer[]> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("customers")
            .select("*")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false });

        if (error) {
            throw error;
        }

        return ((data ?? []) as CustomerRow[]).map(rowToCustomer);
    }

    async getCustomer(_organizationId: string, customerId: string): Promise<Customer | null> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("customers")
            .select("*")
            .eq("organization_id", organizationId)
            .eq("id", customerId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data ? rowToCustomer(data as CustomerRow) : null;
    }

    async getCustomerByEmail(_organizationId: string, email: string): Promise<Customer | null> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("customers")
            .select("*")
            .eq("organization_id", organizationId)
            .ilike("email", email.trim())
            .maybeSingle();

        if (error) {
            throw error;
        }

        return data ? rowToCustomer(data as CustomerRow) : null;
    }

    async saveCustomer(customer: Customer): Promise<Customer> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const payload = customerToRow({
            ...customer,
            organizationId
        });

        const { data, error } = await client
            .from("customers")
            .upsert(payload)
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        return rowToCustomer(data as CustomerRow);
    }

    async deleteCustomer(_organizationId: string, customerId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { error } = await client
            .from("customers")
            .delete()
            .eq("organization_id", organizationId)
            .eq("id", customerId);

        if (error) {
            throw error;
        }
    }

    async listProjectAccess(_organizationId: string): Promise<CustomerProjectAccess[]> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const organizationId = await this.getOrganizationId();
        const { data, error } = await client
            .from("customer_project_access")
            .select("customer_id, project_id, permissions, customers!inner(organization_id)")
            .eq("customers.organization_id", organizationId);

        if (error) {
            throw error;
        }

        return ((data ?? []) as AccessRow[]).map(rowToAccess);
    }

    async listProjectAccessForCustomer(customerId: string): Promise<CustomerProjectAccess[]> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client
            .from("customer_project_access")
            .select("customer_id, project_id, permissions")
            .eq("customer_id", customerId);

        if (error) {
            throw error;
        }

        return ((data ?? []) as AccessRow[]).map(rowToAccess);
    }

    async listProjectAccessForProject(projectId: string): Promise<CustomerProjectAccess[]> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client
            .from("customer_project_access")
            .select("customer_id, project_id, permissions")
            .eq("project_id", projectId);

        if (error) {
            throw error;
        }

        return ((data ?? []) as AccessRow[]).map(rowToAccess);
    }

    async saveProjectAccess(access: CustomerProjectAccess): Promise<CustomerProjectAccess> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client
            .from("customer_project_access")
            .upsert({
                customer_id: access.customerId,
                project_id: access.projectId,
                permissions: access.permissions
            })
            .select("customer_id, project_id, permissions")
            .single();

        if (error) {
            throw error;
        }

        const parsed = rowToAccess(data as AccessRow);
        return isCustomerProjectAccess(parsed) ? parsed : access;
    }

    async removeProjectAccess(customerId: string, projectId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { error } = await client
            .from("customer_project_access")
            .delete()
            .eq("customer_id", customerId)
            .eq("project_id", projectId);

        if (error) {
            throw error;
        }
    }

    async getPortalPassword(_customerId: string): Promise<string | null> {
        return null;
    }

    async setPortalPassword(_customerId: string, _password: string): Promise<void> {
        // Cloud portal auth uses Supabase auth, not local passwords.
    }
}
