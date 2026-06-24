import { useEffect, useState } from "react";
import {
    EMPTY_LOADING_STATE,
    loadingStateService,
    type LoadingState
} from "../../services/system";

const LOADING_LABELS: Record<keyof LoadingState, string> = {
    project: "Loading project…",
    assets: "Loading artwork assets…",
    export: "Generating export…"
};

export function LoadingOverlay() {
    const [loading, setLoading] = useState<LoadingState>(EMPTY_LOADING_STATE);

    useEffect(() => loadingStateService.subscribe(setLoading), []);

    const activeLabels = (Object.entries(loading) as Array<[keyof LoadingState, boolean]>)
        .filter(([, active]) => active)
        .map(([scope]) => LOADING_LABELS[scope]);

    if (activeLabels.length === 0) {
        return null;
    }

    return (
        <div style={styles.backdrop} aria-live="polite" aria-busy="true">
            <div style={styles.panel}>
                {activeLabels.map(label => (
                    <div key={label} style={styles.label}>
                        {label}
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    backdrop: {
        position: "fixed" as const,
        inset: 0,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        pointerEvents: "none" as const,
        zIndex: 1200,
        padding: 24
    },
    panel: {
        minWidth: 240,
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid #4b5562",
        background: "rgba(23, 27, 33, 0.94)",
        color: "#f7f7f2",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
        display: "grid",
        gap: 6
    },
    label: {
        fontSize: 13
    }
};
