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
    type InvitableOrganizationRole,
    type OrganizationInvite,
    type OrganizationMember,
    type OrganizationRole,
    type PermissionAction
} from "../../services/auth";
import { useEditorStore } from "../../store/editorStore";
import { useCloudSession } from "../cloud";

interface PermissionsContextValue {
    role: OrganizationRole;
    members: OrganizationMember[];
    invites: OrganizationInvite[];
    isLoading: boolean;
    error: string | null;
    can: (action: PermissionAction) => boolean;
    canManageUsers: boolean;
    refreshPermissions: () => Promise<void>;
    updateMemberRole: (userId: string, role: OrganizationRole) => Promise<void>;
    createOrganizationInvite: (email: string, role: InvitableOrganizationRole) => Promise<void>;
    revokeOrganizationInvite: (inviteId: string) => Promise<void>;
    removeOrganizationMember: (userId: string) => Promise<void>;
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
    const [invites, setInvites] = useState<OrganizationInvite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refreshPermissions = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            clearPermissionCache();
            await permissionService.claimPendingOrganizationInvite();
            const membership = await permissionService.getMembership(user);
            setRole(membership.role);

            if (permissionService.canManageUsers(membership.role)) {
                const [nextMembers, nextInvites] = await Promise.all([
                    permissionService.listOrganizationMembers(),
                    permissionService.listOrganizationInvites()
                ]);
                setMembers(nextMembers);
                setInvites(nextInvites);
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
                setInvites([]);
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

    const createOrganizationInvite = useCallback(
        async (email: string, inviteRole: InvitableOrganizationRole) => {
            await permissionService.createOrganizationInvite(email, inviteRole);
            await refreshPermissions();
        },
        [refreshPermissions]
    );

    const revokeOrganizationInvite = useCallback(async (inviteId: string) => {
        await permissionService.revokeOrganizationInvite(inviteId);
        await refreshPermissions();
    }, [refreshPermissions]);

    const removeOrganizationMember = useCallback(async (userId: string) => {
        await permissionService.removeOrganizationMember(userId);
        await refreshPermissions();
    }, [refreshPermissions]);

    const value = useMemo<PermissionsContextValue>(() => ({
        role,
        members,
        invites,
        isLoading,
        error,
        can,
        canManageUsers,
        refreshPermissions,
        updateMemberRole,
        createOrganizationInvite,
        revokeOrganizationInvite,
        removeOrganizationMember
    }), [
        can,
        canManageUsers,
        createOrganizationInvite,
        error,
        invites,
        isLoading,
        members,
        refreshPermissions,
        removeOrganizationMember,
        revokeOrganizationInvite,
        role,
        updateMemberRole
    ]);

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}
