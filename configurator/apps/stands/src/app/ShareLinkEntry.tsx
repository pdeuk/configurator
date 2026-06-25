import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { resolveAuthPrincipal } from "../services/auth/resolveAuthPrincipal";
import { loadSharedProject } from "../services/sharing";
import { useCloudSession } from "../ui/cloud";
import { SharedProjectViewer } from "./SharedProjectViewer";

/**
 * Routes share links to the right experience:
 * - customer_review → customer portal login, then project review UI
 * - guest_handoff → limited viewer; staff can import the project
 */
export function ShareLinkEntry() {
    const { token } = useParams<{ token: string }>();
    const { user, isSessionReady } = useCloudSession();
    const [redirectTo, setRedirectTo] = useState<string | null>(null);
    const [shareKind, setShareKind] = useState<"customer_review" | "guest_handoff" | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!token) {
            setError("Share link is missing.");
            setReady(true);
            return;
        }

        if (!isSessionReady) {
            return;
        }

        let cancelled = false;

        void (async () => {
            try {
                const result = await loadSharedProject(token);

                if (!result) {
                    if (!cancelled) {
                        setError("This share link is invalid, disabled, or expired.");
                        setReady(true);
                    }

                    return;
                }

                const kind = result.shared.shareKind ?? "customer_review";

                if (!cancelled) {
                    setShareKind(kind);
                }

                if (kind === "guest_handoff") {
                    if (!cancelled) {
                        setReady(true);
                    }

                    return;
                }

                const principal = await resolveAuthPrincipal(user);

                if (principal.type === "customer") {
                    if (!cancelled) {
                        setRedirectTo(`/portal/project/${result.project.id}`);
                    }

                    return;
                }

                if (principal.type === "staff") {
                    if (!cancelled) {
                        setReady(true);
                    }

                    return;
                }

                if (!cancelled) {
                    setRedirectTo(`/portal?shareToken=${encodeURIComponent(token)}`);
                }
            } catch (loadError) {
                console.warn("Share link routing failed.", loadError);

                if (!cancelled) {
                    setError("Unable to open this share link.");
                    setReady(true);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [isSessionReady, token, user]);

    if (redirectTo) {
        return <Navigate to={redirectTo} replace />;
    }

    if (!ready) {
        return (
            <div style={styles.page}>
                <p style={styles.message}>Opening share link…</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.page}>
                <div style={styles.errorPanel}>
                    <h1 style={styles.errorTitle}>Share link unavailable</h1>
                    <p style={styles.errorText}>{error}</p>
                </div>
            </div>
        );
    }

    if (ready && token) {
        return (
            <SharedProjectViewer
                shareToken={token}
                allowGuestClaim={shareKind === "guest_handoff"}
            />
        );
    }

    return (
        <div style={styles.page}>
            <p style={styles.message}>Redirecting to customer portal…</p>
        </div>
    );
}

const styles = {
    page: {
        width: "100vw",
        height: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#171a20",
        color: "#d1d5db",
        fontFamily: "system-ui, sans-serif"
    },
    message: {
        margin: 0,
        fontSize: 15
    },
    errorPanel: {
        padding: 24,
        textAlign: "center" as const
    },
    errorTitle: {
        margin: 0,
        color: "#f7f7f2",
        fontSize: 24
    },
    errorText: {
        marginTop: 12,
        color: "#c5cad3",
        fontSize: 14
    }
} satisfies Record<string, import("react").CSSProperties>;
