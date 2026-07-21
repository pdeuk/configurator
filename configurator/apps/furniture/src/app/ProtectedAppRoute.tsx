import { useEffect } from "react";
import { useCloudSession } from "../ui/cloud";
import { Configurator } from "./Configurator";
import { enableLocalDemoMode } from "./localDemoMode";

export function ProtectedAppRoute() {
    const { isSessionReady } = useCloudSession();

    useEffect(() => {
        enableLocalDemoMode();
    }, []);

    if (!isSessionReady) {
        return (
            <div style={styles.loadingPage}>
                <p style={styles.loadingText}>Loading workspace…</p>
            </div>
        );
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
