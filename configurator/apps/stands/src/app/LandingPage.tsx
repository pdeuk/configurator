import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { isSupabaseConfigured } from "../services/cloud";
import { useCloudSession } from "../ui/cloud";
import { standsClientProfile } from "../../client.config";
import { enableLocalDemoMode } from "./localDemoMode";

export function LandingPage() {
    const navigate = useNavigate();
    const {
        isConfigured,
        user,
        isSessionReady,
        isAuthenticating,
        authError,
        login
    } = useCloudSession();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);
    const supabaseConfigured = isSupabaseConfigured();

    useEffect(() => {
        if (isSessionReady && isConfigured && user) {
            navigate("/app", { replace: true });
        }
    }, [isConfigured, isSessionReady, navigate, user]);

    const handleSubmit = async () => {
        setMessage(null);

        try {
            await login(email, password);
            setMessage("Signed in. Opening app…");
            navigate("/app", { replace: true });
        } catch {
            // authError is surfaced by context
        }
    };

    const handleLocalDemo = () => {
        enableLocalDemoMode();
        navigate("/app", { replace: true });
    };

    if (!isSessionReady) {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <p style={styles.subtitle}>Restoring session…</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.brand}>{standsClientProfile.branding.appName}</div>
                <p style={styles.subtitle}>
                    {standsClientProfile.branding.landingSubtitle}
                </p>

                {!supabaseConfigured ? (
                    <>
                        <div style={styles.modeBanner}>
                            <strong>Running in Local Mode</strong>
                            <span>
                                Supabase is not configured. Projects, settings, and assets are stored in
                                this browser only.
                            </span>
                        </div>
                        <button
                            type="button"
                            style={styles.primaryButton}
                            onClick={handleLocalDemo}
                        >
                            Enter Local Demo Mode
                        </button>
                        <p style={styles.helper}>
                            To enable cloud auth and sync, set{" "}
                            <code style={styles.code}>VITE_SUPABASE_URL</code> and{" "}
                            <code style={styles.code}>VITE_SUPABASE_ANON_KEY</code> on Vercel.
                        </p>
                    </>
                ) : (
                    <>
                        <div style={styles.modeBanner}>
                            <strong>Organization sign-in</strong>
                            <span>Access is by invitation only. Sign in with your existing account.</span>
                        </div>
                        <label style={styles.label}>
                            Email
                            <input
                                type="email"
                                value={email}
                                onChange={event => setEmail(event.target.value)}
                                style={styles.input}
                                autoComplete="email"
                            />
                        </label>
                        <label style={styles.label}>
                            Password
                            <input
                                type="password"
                                value={password}
                                onChange={event => setPassword(event.target.value)}
                                style={styles.input}
                                autoComplete="current-password"
                            />
                        </label>
                        <button
                            type="button"
                            style={styles.primaryButton}
                            disabled={isAuthenticating || !email || !password}
                            onClick={() => void handleSubmit()}
                        >
                            Sign in
                        </button>
                        <p style={styles.helper}>
                            Invited to join?{" "}
                            <Link to="/join" style={styles.link}>
                                Create your account
                            </Link>
                        </p>
                        {message && <p style={styles.success}>{message}</p>}
                        {authError && <p style={styles.error}>{authError}</p>}
                    </>
                )}

                <div style={styles.links}>
                    <Link to="/portal" style={styles.link}>
                        Customer portal
                    </Link>
                </div>
            </div>
        </div>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background: "linear-gradient(180deg, #171a20 0%, #20242b 100%)",
        color: "#f7f7f2",
        fontFamily: "system-ui, sans-serif"
    },
    card: {
        width: "min(440px, 100%)",
        display: "grid",
        gap: 14,
        padding: 28,
        borderRadius: 12,
        border: "1px solid #3b414a",
        background: "#20242b",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)"
    },
    brand: {
        fontSize: 24,
        fontWeight: 700
    },
    subtitle: {
        margin: 0,
        color: "#c5cad3",
        fontSize: 14,
        lineHeight: 1.5
    },
    modeBanner: {
        display: "grid",
        gap: 4,
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid #4b5562",
        background: "#171b21",
        fontSize: 13,
        color: "#d1d5db"
    },
    label: {
        display: "grid",
        gap: 6,
        fontSize: 12,
        color: "#9aa3b2"
    },
    input: {
        border: "1px solid #4b5562",
        background: "#171a20",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        font: "inherit"
    },
    primaryButton: {
        border: "1px solid #64748b",
        background: "#334155",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "12px 14px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 14,
        fontWeight: 600
    },
    helper: {
        margin: 0,
        fontSize: 13,
        color: "#9aa3b2",
        lineHeight: 1.5
    },
    code: {
        fontFamily: "ui-monospace, monospace",
        fontSize: 11
    },
    success: {
        margin: 0,
        color: "#86efac",
        fontSize: 13
    },
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 13
    },
    links: {
        display: "flex",
        gap: 12,
        paddingTop: 8,
        borderTop: "1px solid #3b414a"
    },
    link: {
        color: "#93c5fd",
        fontSize: 13,
        textDecoration: "none"
    }
} satisfies Record<string, import("react").CSSProperties>;
