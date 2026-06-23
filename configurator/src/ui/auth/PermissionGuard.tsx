import type { ReactNode } from "react";
import type { PermissionAction } from "../../services/auth";
import { usePermissions } from "./PermissionsProvider";

interface PermissionGuardProps {
    action: PermissionAction;
    children: ReactNode;
    fallback?: ReactNode;
}

export function PermissionGuard({
    action,
    children,
    fallback = null
}: PermissionGuardProps) {
    const { can } = usePermissions();

    if (!can(action)) {
        return fallback;
    }

    return children;
}
