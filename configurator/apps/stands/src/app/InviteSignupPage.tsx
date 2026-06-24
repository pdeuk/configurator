import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { hasPendingOrganizationInvite, isSupabaseConfigured } from "../services/cloud";
import { useCloudSession } from "../ui/cloud";

export function InviteSignupPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const {
        isConfigured,
        user,
        isSessionReady,
        isAuthenticating,
        authError,
        register
    } = useCloudSession();
    const [email, setEmail] = useState(() => searchParams.get("email")?.trim().toLowerCase() ?? "");
    const [password, setPassword] = useState("");
    const [inviteStatus, setInviteStatus] = useState<"unknown" | "valid" | "invalid">("unknown");
    const [message, setMessage] = useState<string | null>(null);
    const supabaseConfigured = isSupabaseConfigured();

    useEffect(() => {
        if (isSessionReady && isConfigured && user) {
            navigate("/app", { replace: true });
        }
    }, [isConfigured, isSessionReady, navigate, user]);

    useEffect(() => {
        const normalizedEmail = email.trim().toLowerCase();

        if (!supabaseConfigured || !normalizedEmail) {
            setInviteStatus("unknown");
            return;
        }

        let cancelled = false;

        void hasPendingOrganizationInvite(normalizedEmail)
            .then(isInvited => {
                if (!cancelled) {
                    setInviteStatus(isInvited ? "valid" : "invalid");
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setInviteStatus("unknown");
                }
            });

        return () => {
            cancelled = true;
        };
    }, [email, supabaseConfigured]);

    const handleSubmit = async () => {
        setMessage(null);

        try {
            await register(email, password);
            setMessage("Account created. Opening app…");
            navigate("/app", { replace: true });
        } catch {
            // authError is surfaced by context
        }
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

    if (!supabaseConfigured) {
        return (
            <div style={styles.page}>
                <div style={styles.card}>
                    <div style={styles.brand}>Accept invitation</div>
                    <p style={styles.subtitle}>
                        Cloud sign-up is not configured on this deployment.
                    </p>
                    <Link to="/" style={styles.link}>
                        Back to sign in
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.brand}>Accept invitation</div>
                <p style={styles.subtitle}>
                    Create your account with the email address your organization admin invited.
                </p>

                <label style={styles.label}>
                    Invited email
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
                        autoComplete="new-password"
                    />
                </label>

                {inviteStatus === "valid" && (
                    <p style={styles.success}>Invitation found for this email.</p>
                )}
                {inviteStatus === "invalid" && email.trim() && (
                    <p style={styles.error}>
                        No pending invitation for this email. Ask your admin to invite you first.
                    </p>
                )}

                <button
                    type="button"
                    style={styles.primaryButton}
                    disabled={
                        isAuthenticating
                        || !email.trim()
                        || !password
                        || inviteStatus === "invalid"
                    }
                    onClick={() => void handleSubmit()}
                >
                    Create account
                </button>

                {message && <p style={styles.success}>{message}</p>}
                {authError && <p style={styles.error}>{authError}</p>}

                <p style={styles.helper}>
                    Already have an account?{" "}
                    <Link to="/" style={styles.link}>
                        Sign in
                    </Link>
                </p>
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
        color: "#9aa3b2"
    },
    link: {
        color: "#93c5fd",
        textDecoration: "none"
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
    }
} satisfies Record<string, import("react").CSSProperties>;
