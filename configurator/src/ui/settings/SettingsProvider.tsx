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
    settingsService,
    syncSettingsContextFromCloudUser,
    type CompanySettings,
    type CompanySettingsUpdate,
    type MaterialCatalog,
    type MaterialCatalogUpdate
} from "../../services/settings";
import { useCloudSession } from "../cloud";

interface SettingsContextValue {
    settings: CompanySettings | null;
    materialCatalog: MaterialCatalog | null;
    isLoading: boolean;
    isSaving: boolean;
    error: string | null;
    refreshSettings: () => Promise<void>;
    saveCompanySettings: (update: CompanySettingsUpdate) => Promise<void>;
    saveMaterialCatalog: (update: MaterialCatalogUpdate) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
    const context = useContext(SettingsContext);

    if (!context) {
        throw new Error("useSettings must be used within SettingsProvider");
    }

    return context;
}

interface SettingsProviderProps {
    children: ReactNode;
}

export function SettingsProvider({ children }: SettingsProviderProps) {
    const { user } = useCloudSession();
    const [settings, setSettings] = useState<CompanySettings | null>(null);
    const [materialCatalog, setMaterialCatalog] = useState<MaterialCatalog | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const refreshSettings = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            syncSettingsContextFromCloudUser(user);
            const [nextSettings, nextCatalog] = await Promise.all([
                settingsService.getSettings(),
                settingsService.getMaterialCatalog()
            ]);
            setSettings(nextSettings);
            setMaterialCatalog(nextCatalog);
        } catch (loadError) {
            console.warn("Settings load failed.", loadError);
            setError("Unable to load organization settings.");
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        void refreshSettings();
    }, [refreshSettings]);

    useEffect(() => {
        const handleUpdated = () => {
            void refreshSettings();
        };

        window.addEventListener("configurator:settings-updated", handleUpdated);

        return () => {
            window.removeEventListener("configurator:settings-updated", handleUpdated);
        };
    }, [refreshSettings]);

    const saveCompanySettings = useCallback(async (update: CompanySettingsUpdate) => {
        setIsSaving(true);
        setError(null);

        try {
            const next = await settingsService.updateSettings(update);
            setSettings(next);
        } catch (saveError) {
            console.warn("Company settings save failed.", saveError);
            setError("Unable to save company settings.");
            throw saveError;
        } finally {
            setIsSaving(false);
        }
    }, []);

    const saveMaterialCatalog = useCallback(async (update: MaterialCatalogUpdate) => {
        setIsSaving(true);
        setError(null);

        try {
            const next = await settingsService.updateMaterialCatalog(update);
            setMaterialCatalog(next);
        } catch (saveError) {
            console.warn("Material catalog save failed.", saveError);
            setError("Unable to save material catalog.");
            throw saveError;
        } finally {
            setIsSaving(false);
        }
    }, []);

    const value = useMemo<SettingsContextValue>(() => ({
        settings,
        materialCatalog,
        isLoading,
        isSaving,
        error,
        refreshSettings,
        saveCompanySettings,
        saveMaterialCatalog
    }), [
        error,
        isLoading,
        isSaving,
        materialCatalog,
        refreshSettings,
        saveCompanySettings,
        saveMaterialCatalog,
        settings
    ]);

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
