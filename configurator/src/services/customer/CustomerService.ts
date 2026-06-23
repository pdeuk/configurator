import type { ProjectDocument } from "../../models/ProjectModel";
import { normalizeProjectDocument } from "../../lib/projectSerialization";
import { ProjectService } from "../ProjectService";
import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { getSupabaseClient, isSupabaseConfigured } from "../cloud/SupabaseClient";
import { getProjectStorage } from "../cloud";
import { isBrowserOnline } from "../cloud/syncStatus";
import { getSettingsContext } from "../settings/SettingsService";
import type {
    AssignProjectToCustomerInput,
    CreateCustomerInput,
    Customer,
    CustomerProjectAccess,
    CustomerProjectPermissions,
    CustomerProjectSummary
} from "./CustomerModel";
import {
    localCustomerStorage,
    mergeAssignProjectInput,
    type CustomerStorage
} from "./CustomerStorage";
import { SupabaseCustomerStorage } from "./SupabaseCustomerStorage";

const PORTAL_SESSION_KEY = "configurator:customer-portal:session";

interface PortalSession {
    customerId: string;
    organizationId: string;
}

function canUseCloudCustomers(): boolean {
    const { user } = getCloudStorageContext();
    return Boolean(isSupabaseConfigured() && user && isBrowserOnline());
}

function getOrgStorage(): CustomerStorage {
    const { user } = getCloudStorageContext();

    if (canUseCloudCustomers() && user) {
        return new SupabaseCustomerStorage(user.id);
    }

    return localCustomerStorage;
}

function getActiveOrganizationId(): string {
    return getSettingsContext().organizationId;
}

function readPortalSession(): PortalSession | null {
    const raw = sessionStorage.getItem(PORTAL_SESSION_KEY);

    if (!raw) {
        return null;
    }

    try {
        return JSON.parse(raw) as PortalSession;
    } catch {
        return null;
    }
}

function writePortalSession(session: PortalSession | null): void {
    if (!session) {
        sessionStorage.removeItem(PORTAL_SESSION_KEY);
        return;
    }

    sessionStorage.setItem(PORTAL_SESSION_KEY, JSON.stringify(session));
}

export class CustomerService {
    async createCustomer(input: CreateCustomerInput): Promise<Customer> {
        const organizationId = getActiveOrganizationId();
        const customer: Customer = {
            id: crypto.randomUUID(),
            organizationId,
            name: input.name.trim(),
            email: input.email.trim(),
            company: input.company?.trim() ?? "",
            authUserId: null,
            createdAt: new Date().toISOString()
        };

        const saved = await getOrgStorage().saveCustomer(customer);

        if (input.portalPassword?.trim()) {
            await localCustomerStorage.setPortalPassword(saved.id, input.portalPassword.trim());
        }

        return saved;
    }

    async listCustomers(): Promise<Customer[]> {
        return getOrgStorage().listCustomers(getActiveOrganizationId());
    }

    async getCustomer(customerId: string): Promise<Customer | null> {
        return getOrgStorage().getCustomer(getActiveOrganizationId(), customerId);
    }

    async deleteCustomer(customerId: string): Promise<void> {
        const accessEntries = await getOrgStorage().listProjectAccessForCustomer(customerId);
        await Promise.all(
            accessEntries.map(entry =>
                getOrgStorage().removeProjectAccess(entry.customerId, entry.projectId)
            )
        );
        await getOrgStorage().deleteCustomer(getActiveOrganizationId(), customerId);
    }

    async assignProjectToCustomer(input: AssignProjectToCustomerInput): Promise<CustomerProjectAccess> {
        const access = mergeAssignProjectInput(input);
        return getOrgStorage().saveProjectAccess(access);
    }

    async removeProjectAccess(customerId: string, projectId: string): Promise<void> {
        await getOrgStorage().removeProjectAccess(customerId, projectId);
    }

    async getCustomerProjects(customerId: string): Promise<CustomerProjectSummary[]> {
        const accessEntries = await getOrgStorage().listProjectAccessForCustomer(customerId);
        const projectService = new ProjectService(getProjectStorage());

        const summaries = await Promise.all(
            accessEntries.map(async access => {
                const project = await projectService.load(access.projectId);

                return {
                    projectId: access.projectId,
                    projectName: project?.name ?? access.projectId,
                    permissions: access.permissions,
                    reviewStatus: null,
                    updatedAt: project?.updatedAt ?? null
                } satisfies CustomerProjectSummary;
            })
        );

        return summaries.sort((left, right) =>
            (right.updatedAt ?? "").localeCompare(left.updatedAt ?? "")
        );
    }

    async listProjectAssignments(projectId: string): Promise<Array<CustomerProjectAccess & { customer: Customer | null }>> {
        const accessEntries = await getOrgStorage().listProjectAccessForProject(projectId);
        const organizationId = getActiveOrganizationId();

        return Promise.all(
            accessEntries.map(async access => ({
                ...access,
                customer: await getOrgStorage().getCustomer(organizationId, access.customerId)
            }))
        );
    }

    async assertCustomerProjectAccess(
        customerId: string,
        projectId: string,
        permission: keyof CustomerProjectPermissions
    ): Promise<CustomerProjectAccess> {
        const entries = await getOrgStorage().listProjectAccessForCustomer(customerId);
        const access = entries.find(entry => entry.projectId === projectId);

        if (!access || !access.permissions.view) {
            throw new Error("Project access denied.");
        }

        if (permission === "comment" && !access.permissions.comment) {
            throw new Error("Comment permission denied.");
        }

        if (permission === "approve" && !access.permissions.approve) {
            throw new Error("Approval permission denied.");
        }

        return access;
    }

    async loadProjectForCustomer(
        customerId: string,
        projectId: string
    ): Promise<ProjectDocument | null> {
        await this.assertCustomerProjectAccess(customerId, projectId, "view");

        if (canUseCloudCustomers()) {
            const client = getSupabaseClient();

            if (client) {
                const { data, error } = await client.rpc("customer_load_project", {
                    p_customer_id: customerId,
                    p_project_id: projectId
                });

                if (!error && data) {
                    return normalizeProjectDocument(data);
                }
            }
        }

        const projectService = new ProjectService(getProjectStorage());
        return projectService.load(projectId);
    }

    async loginPortal(email: string, password: string): Promise<Customer> {
        const organizationId = getActiveOrganizationId();
        const normalizedEmail = email.trim().toLowerCase();

        if (canUseCloudCustomers()) {
            throw new Error("Use Supabase sign-in for cloud customer portal access.");
        }

        const customer = await localCustomerStorage.getCustomerByEmail(organizationId, normalizedEmail);

        if (!customer) {
            throw new Error("Customer account not found.");
        }

        const storedPassword = await localCustomerStorage.getPortalPassword(customer.id);

        if (!storedPassword || storedPassword !== password) {
            throw new Error("Invalid customer credentials.");
        }

        writePortalSession({
            customerId: customer.id,
            organizationId: customer.organizationId
        });

        return customer;
    }

    async linkPortalAuthUser(customerId: string, authUserId: string): Promise<Customer> {
        const customer = await this.getCustomer(customerId);

        if (!customer) {
            throw new Error("Customer not found.");
        }

        return getOrgStorage().saveCustomer({
            ...customer,
            authUserId
        });
    }

    async getPortalCustomerByAuthUser(authUserId: string): Promise<Customer | null> {
        if (canUseCloudCustomers()) {
            const client = getSupabaseClient();

            if (client) {
                const { data, error } = await client
                    .from("customers")
                    .select("*")
                    .eq("auth_user_id", authUserId)
                    .maybeSingle();

                if (!error && data) {
                    return {
                        id: data.id,
                        organizationId: data.organization_id,
                        name: data.name,
                        email: data.email,
                        company: data.company,
                        authUserId: data.auth_user_id,
                        createdAt: data.created_at
                    };
                }
            }
        }

        const customers = await localCustomerStorage.listCustomers(getActiveOrganizationId());
        return customers.find(customer => customer.authUserId === authUserId) ?? null;
    }

    getPortalSession(): PortalSession | null {
        return readPortalSession();
    }

    setPortalSession(customer: Customer): void {
        writePortalSession({
            customerId: customer.id,
            organizationId: customer.organizationId
        });
    }

    clearPortalSession(): void {
        writePortalSession(null);
    }

    async getAuthenticatedPortalCustomer(): Promise<Customer | null> {
        const { user } = getCloudStorageContext();

        if (user) {
            const linked = await this.getPortalCustomerByAuthUser(user.id);

            if (linked) {
                this.setPortalSession(linked);
                return linked;
            }
        }

        const session = readPortalSession();

        if (!session) {
            return null;
        }

        return this.getCustomer(session.customerId);
    }
}

export const customerService = new CustomerService();

export function createCustomer(input: CreateCustomerInput): Promise<Customer> {
    return customerService.createCustomer(input);
}

export function listCustomers(): Promise<Customer[]> {
    return customerService.listCustomers();
}

export function assignProjectToCustomer(
    input: AssignProjectToCustomerInput
): Promise<CustomerProjectAccess> {
    return customerService.assignProjectToCustomer(input);
}

export function removeProjectAccess(customerId: string, projectId: string): Promise<void> {
    return customerService.removeProjectAccess(customerId, projectId);
}

export function getCustomerProjects(customerId: string): Promise<CustomerProjectSummary[]> {
    return customerService.getCustomerProjects(customerId);
}

export function deleteCustomer(customerId: string): Promise<void> {
    return customerService.deleteCustomer(customerId);
}
