import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode
} from "react";
import { AssignCustomerDialog } from "../customer/AssignCustomerDialog";
import { UserManagementPanel } from "../auth";
import { AdminPanel, type AdminTab } from "../settings/AdminPanel";

interface AppShellContextValue {
    reviewsVisible: boolean;
    toggleReviews: () => void;
    showReviews: () => void;
    openAdmin: (tab?: AdminTab) => void;
    closeAdmin: () => void;
    openAssignCustomer: () => void;
    closeAssignCustomer: () => void;
    openUsers: () => void;
    closeUsers: () => void;
    adminOpen: boolean;
    adminTab: AdminTab;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
    const context = useContext(AppShellContext);

    if (!context) {
        throw new Error("useAppShell must be used within AppShellProvider.");
    }

    return context;
}

export function AppShellProvider({ children }: { children: ReactNode }) {
    const [reviewsVisible, setReviewsVisible] = useState(false);
    const [adminOpen, setAdminOpen] = useState(false);
    const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
    const [assignCustomerOpen, setAssignCustomerOpen] = useState(false);
    const [usersOpen, setUsersOpen] = useState(false);

    const openAdmin = useCallback((tab: AdminTab = "dashboard") => {
        setAdminTab(tab);
        setAdminOpen(true);
    }, []);

    const closeAdmin = useCallback(() => {
        setAdminOpen(false);
    }, []);

    const openAssignCustomer = useCallback(() => {
        setAssignCustomerOpen(true);
    }, []);

    const closeAssignCustomer = useCallback(() => {
        setAssignCustomerOpen(false);
    }, []);

    const openUsers = useCallback(() => {
        setUsersOpen(true);
    }, []);

    const closeUsers = useCallback(() => {
        setUsersOpen(false);
    }, []);

    const toggleReviews = useCallback(() => {
        setReviewsVisible(current => !current);
    }, []);

    const showReviews = useCallback(() => {
        setReviewsVisible(true);
    }, []);

    const value = useMemo<AppShellContextValue>(() => ({
        reviewsVisible,
        toggleReviews,
        showReviews,
        openAdmin,
        closeAdmin,
        openAssignCustomer,
        closeAssignCustomer,
        openUsers,
        closeUsers,
        adminOpen,
        adminTab
    }), [
        adminOpen,
        adminTab,
        closeAdmin,
        closeAssignCustomer,
        closeUsers,
        openAdmin,
        openAssignCustomer,
        openUsers,
        reviewsVisible,
        showReviews,
        toggleReviews
    ]);

    return (
        <AppShellContext.Provider value={value}>
            {children}
            <AdminPanel
                isOpen={adminOpen}
                onClose={closeAdmin}
                initialTab={adminTab}
            />
            <AssignCustomerDialog
                isOpen={assignCustomerOpen}
                onClose={closeAssignCustomer}
            />
            <UserManagementPanel isOpen={usersOpen} onClose={closeUsers} />
        </AppShellContext.Provider>
    );
}

export type { AdminTab };
