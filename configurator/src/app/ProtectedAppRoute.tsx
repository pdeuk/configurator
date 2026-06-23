import { Navigate } from "react-router-dom";
import { isSupabaseConfigured } from "../services/cloud";
import { useCloudSession } from "../ui/cloud";
import { Configurator } from "./Configurator";
import { isLocalDemoMode } from "./localDemoMode";

export function ProtectedAppRoute() {
    const { user, isSessionReady } = useCloudSession();
    const supabaseConfigured = isSupabaseConfigured();

    if (!isSessionReady) {
        return (
            <div style={styles.loadingPage}>
                <p style={styles.loadingText}>Loading workspace…</p>
            </div>
        );
    }

    if (supabaseConfigured) {
        if (!user) {
            return <Navigate to="/" replace />;
        }

        return <Configurator />;
    }

    if (!isLocalDemoMode()) {
        return <Navigate to="/" replace />;
    }

    return <Configurator />;
}

const styles = {
    loadingPage: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#171a20",
        color: "#d1d5db",
        fontFamily: "system-ui, sans-serif"
    },
    loadingText: {
        margin: 0,
        fontSize: 15
    }
} satisfies Record<string, import("react").CSSProperties>;
