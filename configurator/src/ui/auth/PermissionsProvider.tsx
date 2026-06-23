import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode
} from "react";
import {
    clearPermissionCache,
    permissionService,
    type OrganizationMember,
    type OrganizationRole,
    type PermissionAction
} from "../../services/auth";
import { useEditorStore } from "../../store/editorStore";
import { useCloudSession } from "../cloud";

interface PermissionsContextValue {
    role: OrganizationRole;
    members: OrganizationMember[];
    isLoading: boolean;
    error: string | null;
    can: (action: PermissionAction) => boolean;
    canManageUsers: boolean;
    refreshPermissions: () => Promise<void>;
    updateMemberRole: (userId: string, role: OrganizationRole) => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function usePermissions() {
    const context = useContext(PermissionsContext);

    if (!context) {
        throw new Error("usePermissions must be used within PermissionsProvider");
    }

    return context;
}

interface PermissionsProviderProps {
    children: ReactNode;
}

export function PermissionsProvider({ children }: PermissionsProviderProps) {
    const { user } = useCloudSession();
    const [role, setRole] = useState<OrganizationRole>("owner");
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshPermissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            clearPermissionCache();
            const membership = await permissionService.getMembership(user);
            setRole(membership.role);

            if (permissionService.canManageUsers(membership.role)) {
                const nextMembers = await permissionService.listOrganizationMembers();
                setMembers(nextMembers);
            } else {
                setMembers([
                    {
                        userId: membership.userId,
                        organizationId: membership.organizationId,
                        email: user?.email ?? "local@configurator.dev",
                        name: user?.email?.split("@")[0] ?? "Local User",
                        role: membership.role
                    }
                ]);
            }
        } catch (loadError) {
            console.warn("Permission load failed.", loadError);
            setError("Unable to load organization permissions.");
            setRole("owner");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        void refreshPermissions();
    }, [refreshPermissions]);

    useEffect(() => {
        const handleUpdated = () => {
            void refreshPermissions();
        };

        window.addEventListener("configurator:permissions-updated", handleUpdated);

        return () => {
            window.removeEventListener("configurator:permissions-updated", handleUpdated);
        };
    }, [refreshPermissions]);

    const can = useCallback(
        (action: PermissionAction) => permissionService.can(action, role),
        [role]
    );

    const canManageUsers = permissionService.canManageUsers(role);

    useEffect(() => {
        useEditorStore.getState().setReadOnly(!can("projects.edit"));
    }, [can, role]);

    const updateMemberRole = useCallback(async (userId: string, nextRole: OrganizationRole) => {
        await permissionService.updateMemberRole(userId, nextRole);
        await refreshPermissions();
    }, [refreshPermissions]);

    const value = useMemo<PermissionsContextValue>(() => ({
        role,
        members,
        isLoading,
        error,
        can,
        canManageUsers,
        refreshPermissions,
        updateMemberRole
    }), [
        can,
        canManageUsers,
        error,
        isLoading,
        members,
        refreshPermissions,
        role,
        updateMemberRole
    ]);

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}
