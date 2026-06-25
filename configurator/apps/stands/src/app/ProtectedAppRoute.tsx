import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { isSupabaseConfigured } from "../services/cloud";
import { resolveAuthPrincipal } from "../services/auth/resolveAuthPrincipal";
import { useCloudSession } from "../ui/cloud";
import { Configurator } from "./Configurator";
import { isLocalDemoMode } from "./localDemoMode";

export function ProtectedAppRoute() {
    const { user, isSessionReady } = useCloudSession();
    const supabaseConfigured = isSupabaseConfigured();
    const [redirectTo, setRedirectTo] = useState<string | null>(null);
    const [principalChecked, setPrincipalChecked] = useState(!supabaseConfigured);

    useEffect(() => {
        if (!supabaseConfigured || !isSessionReady || !user) {
            setPrincipalChecked(true);
            return;
        }

        let cancelled = false;

        void resolveAuthPrincipal(user).then(principal => {
            if (cancelled) {
                return;
            }

            if (principal.type === "customer") {
                setRedirectTo("/portal");
            }

            setPrincipalChecked(true);
        });

        return () => {
            cancelled = true;
        };
    }, [isSessionReady, supabaseConfigured, user]);

    if (!isSessionReady || (supabaseConfigured && user && !principalChecked)) {
        return (
            <div style={styles.loadingPage}>
                <p style={styles.loadingText}>Loading workspace…</p>
            </div>
        );
    }

    if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
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
