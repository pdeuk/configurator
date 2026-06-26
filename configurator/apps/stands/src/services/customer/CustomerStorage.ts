import type {
    AssignProjectToCustomerInput,
    Customer,
    CustomerProjectAccess
} from "./CustomerModel";
import { isCustomer, normalizeCustomerProjectPermissions } from "./CustomerModel";

export interface CustomerStorage {
    listCustomers(organizationId: string): Promise<Customer[]>;
    getCustomer(organizationId: string, customerId: string): Promise<Customer | null>;
    getCustomerByEmail(organizationId: string, email: string): Promise<Customer | null>;
    saveCustomer(customer: Customer): Promise<Customer>;
    deleteCustomer(organizationId: string, customerId: string): Promise<void>;
    listProjectAccess(organizationId: string): Promise<CustomerProjectAccess[]>;
    listProjectAccessForCustomer(customerId: string): Promise<CustomerProjectAccess[]>;
    listProjectAccessForProject(projectId: string): Promise<CustomerProjectAccess[]>;
    saveProjectAccess(access: CustomerProjectAccess): Promise<CustomerProjectAccess>;
    removeProjectAccess(customerId: string, projectId: string): Promise<void>;
    getPortalPassword(customerId: string): Promise<string | null>;
    setPortalPassword(customerId: string, password: string): Promise<void>;
}

const CUSTOMER_INDEX_PREFIX = "configurator:customers:index:";
const CUSTOMER_ITEM_PREFIX = "configurator:customers:item:";
const ACCESS_INDEX_KEY = "configurator:customers:access-index";
const PORTAL_PASSWORD_PREFIX = "configurator:customers:portal-password:";
const PORTAL_PASSWORD_HASH_VERSION = 1;

interface StoredPortalPasswordHash {
    version: typeof PORTAL_PASSWORD_HASH_VERSION;
    algorithm: "SHA-256";
    salt: string;
    hash: string;
}

function customerIndexKey(organizationId: string): string {
    return `${CUSTOMER_INDEX_PREFIX}${organizationId}`;
}

function customerItemKey(organizationId: string, customerId: string): string {
    return `${CUSTOMER_ITEM_PREFIX}${organizationId}:${customerId}`;
}

function readCustomerIndex(organizationId: string): string[] {
    const raw = localStorage.getItem(customerIndexKey(organizationId));

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as string[];
    } catch {
        return [];
    }
}

function writeCustomerIndex(organizationId: string, customerIds: string[]): void {
    localStorage.setItem(customerIndexKey(organizationId), JSON.stringify(customerIds));
}

function readAccessIndex(): CustomerProjectAccess[] {
    const raw = localStorage.getItem(ACCESS_INDEX_KEY);

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as CustomerProjectAccess[];
    } catch {
        return [];
    }
}

function writeAccessIndex(entries: CustomerProjectAccess[]): void {
    localStorage.setItem(ACCESS_INDEX_KEY, JSON.stringify(entries));
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = "";

    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);

    for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index);
    }

    return bytes;
}

async function hashPortalPassword(
    password: string,
    salt = bytesToBase64(crypto.getRandomValues(new Uint8Array(16)))
): Promise<StoredPortalPasswordHash> {
    const saltBytes = base64ToBytes(salt);
    const passwordBytes = new TextEncoder().encode(password);
    const payload = new Uint8Array(saltBytes.length + passwordBytes.length);
    payload.set(saltBytes);
    payload.set(passwordBytes, saltBytes.length);
    const digest = await crypto.subtle.digest("SHA-256", payload);

    return {
        version: PORTAL_PASSWORD_HASH_VERSION,
        algorithm: "SHA-256",
        salt,
        hash: bytesToBase64(new Uint8Array(digest))
    };
}

function parsePortalPasswordHash(value: string): StoredPortalPasswordHash | null {
    try {
        const parsed = JSON.parse(value) as Partial<StoredPortalPasswordHash>;

        if (
            parsed.version === PORTAL_PASSWORD_HASH_VERSION &&
            parsed.algorithm === "SHA-256" &&
            typeof parsed.salt === "string" &&
            typeof parsed.hash === "string"
        ) {
            return parsed as StoredPortalPasswordHash;
        }
    } catch {
        return null;
    }

    return null;
}

export async function verifyPortalPasswordRecord(
    storedPassword: string | null,
    password: string
): Promise<"match" | "legacy_match" | "no_match"> {
    if (!storedPassword) {
        return "no_match";
    }

    const parsed = parsePortalPasswordHash(storedPassword);

    if (!parsed) {
        return storedPassword === password ? "legacy_match" : "no_match";
    }

    const hashed = await hashPortalPassword(password, parsed.salt);
    return hashed.hash === parsed.hash ? "match" : "no_match";
}

export class LocalCustomerStorage implements CustomerStorage {
    async listCustomers(organizationId: string): Promise<Customer[]> {
        const customerIds = readCustomerIndex(organizationId);
        const customers = await Promise.all(
            customerIds.map(customerId => this.getCustomer(organizationId, customerId))
        );

        return customers
            .filter((customer): customer is Customer => customer !== null)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    async getCustomer(organizationId: string, customerId: string): Promise<Customer | null> {
        const raw = localStorage.getItem(customerItemKey(organizationId, customerId));

        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as unknown;

            if (!isCustomer(parsed) || parsed.organizationId !== organizationId) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    async getCustomerByEmail(organizationId: string, email: string): Promise<Customer | null> {
        const customers = await this.listCustomers(organizationId);
        const normalizedEmail = email.trim().toLowerCase();
        return customers.find(customer => customer.email.toLowerCase() === normalizedEmail) ?? null;
    }

    async saveCustomer(customer: Customer): Promise<Customer> {
        localStorage.setItem(
            customerItemKey(customer.organizationId, customer.id),
            JSON.stringify(customer)
        );

        const nextIndex = readCustomerIndex(customer.organizationId).filter(id => id !== customer.id);
        nextIndex.unshift(customer.id);
        writeCustomerIndex(customer.organizationId, nextIndex);

        return customer;
    }

    async deleteCustomer(organizationId: string, customerId: string): Promise<void> {
        localStorage.removeItem(customerItemKey(organizationId, customerId));
        writeCustomerIndex(
            organizationId,
            readCustomerIndex(organizationId).filter(id => id !== customerId)
        );

        const remainingAccess = readAccessIndex().filter(entry => entry.customerId !== customerId);
        writeAccessIndex(remainingAccess);
        localStorage.removeItem(`${PORTAL_PASSWORD_PREFIX}${customerId}`);
    }

    async listProjectAccess(_organizationId: string): Promise<CustomerProjectAccess[]> {
        return readAccessIndex();
    }

    async listProjectAccessForCustomer(customerId: string): Promise<CustomerProjectAccess[]> {
        return readAccessIndex().filter(entry => entry.customerId === customerId);
    }

    async listProjectAccessForProject(projectId: string): Promise<CustomerProjectAccess[]> {
        return readAccessIndex().filter(entry => entry.projectId === projectId);
    }

    async saveProjectAccess(access: CustomerProjectAccess): Promise<CustomerProjectAccess> {
        const next = readAccessIndex().filter(
            entry => !(entry.customerId === access.customerId && entry.projectId === access.projectId)
        );
        next.push(access);
        writeAccessIndex(next);
        return access;
    }

    async removeProjectAccess(customerId: string, projectId: string): Promise<void> {
        writeAccessIndex(
            readAccessIndex().filter(
                entry => !(entry.customerId === customerId && entry.projectId === projectId)
            )
        );
    }

    async getPortalPassword(customerId: string): Promise<string | null> {
        return localStorage.getItem(`${PORTAL_PASSWORD_PREFIX}${customerId}`);
    }

    async setPortalPassword(customerId: string, password: string): Promise<void> {
        const hashed = await hashPortalPassword(password);
        localStorage.setItem(
            `${PORTAL_PASSWORD_PREFIX}${customerId}`,
            JSON.stringify(hashed)
        );
    }
}

export const localCustomerStorage = new LocalCustomerStorage();

export function mergeAssignProjectInput(
    input: AssignProjectToCustomerInput
): CustomerProjectAccess {
    return {
        customerId: input.customerId,
        projectId: input.projectId,
        permissions: normalizeCustomerProjectPermissions(input.permissions)
    };
}
