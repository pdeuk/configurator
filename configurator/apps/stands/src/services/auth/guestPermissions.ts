import type { PermissionAction } from "@configurator/core/auth";

/** Limited capabilities for guest self-service design (scenario 2). */
export const GUEST_PERMISSIONS: Record<PermissionAction, boolean> = {
    "projects.create": false,
    "projects.edit": true,
    "projects.delete": false,
    "projects.view": true,
    "quotes.create": false,
    "quotes.export": false,
    "manufacturing.view": false,
    "manufacturing.export": false,
    "settings.edit": false
};

export function guestCan(action: PermissionAction): boolean {
    return GUEST_PERMISSIONS[action];
}
