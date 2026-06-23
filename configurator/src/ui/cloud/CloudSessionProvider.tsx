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
    cloudAuthService,
    createCloudAssetStoreForUser,
    importLocalProjectsToCloud,
    installOnlineStatusListeners,
    isSupabaseConfigured,
    setActiveCloudAssetStore,
    setCloudStorageContext,
    setCloudSyncStatus,
    subscribeCloudSyncStatus,
    type AuthUser,
    type CloudSyncStatus,
    type ImportProjectsToCloudResult
} from "../../services/cloud";

interface CloudSessionContextValue {
    isConfigured: boolean;
    user: AuthUser | null;
    syncStatus: CloudSyncStatus;
    isAuthenticating: boolean;
    authError: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    importLocalProjects: () => Promise<ImportProjectsToCloudResult>;
}

const CloudSessionContext = createContext<CloudSessionContextValue | null>(null);

export function useCloudSession() {
    const context = useContext(CloudSessionContext);

    if (!context) {
        throw new Error("useCloudSession must be used within CloudSessionProvider");
    }

    return context;
}

interface CloudSessionProviderProps {
    children: ReactNode;
}

export function CloudSessionProvider({ children }: CloudSessionProviderProps) {
    const isConfigured = isSupabaseConfigured();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>("local");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    useEffect(() => {
        if (!isConfigured) {
            setCloudStorageContext({ user: null });
            setActiveCloudAssetStore(null);
            setCloudSyncStatus("local");
            return;
        }

        let cancelled = false;

        void cloudAuthService.getCurrentUser().then(currentUser => {
            if (!cancelled) {
                setUser(currentUser);
                setCloudStorageContext({ user: currentUser });
                setActiveCloudAssetStore(createCloudAssetStoreForUser(currentUser));
                setCloudSyncStatus(currentUser ? "synced" : "local");
            }
        });

        const unsubscribeAuth = cloudAuthService.onAuthStateChange(nextUser => {
            setUser(nextUser);
            setCloudStorageContext({ user: nextUser });
            setActiveCloudAssetStore(createCloudAssetStoreForUser(nextUser));
            setCloudSyncStatus(nextUser ? "synced" : "local");
        });
        const unsubscribeSync = subscribeCloudSyncStatus(setSyncStatus);
        const unsubscribeOnline = installOnlineStatusListeners();

        return () => {
            cancelled = true;
            unsubscribeAuth();
            unsubscribeSync();
            unsubscribeOnline();
        };
    }, [isConfigured]);

    const login = useCallback(async (email: string, password: string) => {
        setIsAuthenticating(true);
        setAuthError(null);

        try {
            await cloudAuthService.login(email, password);
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Login failed.");
            throw error;
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const register = useCallback(async (email: string, password: string) => {
        setIsAuthenticating(true);
        setAuthError(null);

        try {
            await cloudAuthService.register(email, password);
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Registration failed.");
            throw error;
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const logout = useCallback(async () => {
        setIsAuthenticating(true);
        setAuthError(null);

        try {
            await cloudAuthService.logout();
            setCloudSyncStatus("local");
        } catch (error) {
            setAuthError(error instanceof Error ? error.message : "Logout failed.");
            throw error;
        } finally {
            setIsAuthenticating(false);
        }
    }, []);

    const importLocalProjects = useCallback(async () => {
        if (!user) {
            throw new Error("Sign in to import projects to the cloud.");
        }

        return importLocalProjectsToCloud(user);
    }, [user]);

    const value = useMemo<CloudSessionContextValue>(() => ({
        isConfigured,
        user,
        syncStatus,
        isAuthenticating,
        authError,
        login,
        register,
        logout,
        importLocalProjects
    }), [
        authError,
        importLocalProjects,
        isAuthenticating,
        isConfigured,
        login,
        logout,
        register,
        syncStatus,
        user
    ]);

    return (
        <CloudSessionContext.Provider value={value}>
            {children}
        </CloudSessionContext.Provider>
    );
}
