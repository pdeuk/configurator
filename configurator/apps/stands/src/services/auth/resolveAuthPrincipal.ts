import type { AuthUser } from "@configurator/core/cloud";
import { customerService } from "../customer";
import { permissionService } from "./PermissionService";

export type AuthPrincipal =
    | { type: "staff"; userId: string; email: string }
    | { type: "customer"; userId: string; email: string; customerId: string }
    | { type: "anonymous" };

/** Distinguishes staff org members from customer-portal users for routing. */
export async function resolveAuthPrincipal(user: AuthUser | null): Promise<AuthPrincipal> {
    if (!user) {
        return { type: "anonymous" };
    }

    const customer = await customerService.getPortalCustomerByAuthUser(user.id);

    if (customer) {
        return {
            type: "customer",
            userId: user.id,
            email: user.email,
            customerId: customer.id
        };
    }

    const membership = await permissionService.getStaffMembership(user);

    if (membership) {
        return {
            type: "staff",
            userId: user.id,
            email: user.email
        };
    }

    return { type: "anonymous" };
}
