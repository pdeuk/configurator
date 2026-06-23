import { useState } from "react";
import { useCloudSession } from "./CloudSessionProvider";

interface AuthPanelProps {
    onClose: () => void;
}

export function AuthPanel({ onClose }: AuthPanelProps) {
    const {
        user,
        isAuthenticating,
        authError,
        login,
        register,
        logout
    } = useCloudSession();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState<string | null>(null);

    const handleSubmit = async () => {
        setMessage(null);

        try {
            if (mode === "login") {
                await login(email, password);
                setMessage("Signed in");
            } else {
                await register(email, password);
                setMessage("Account created");
            }

            onClose();
        } catch {
            // authError is set by context
        }
    };

    const handleLogout = async () => {
        setMessage(null);

        try {
            await logout();
            onClose();
        } catch {
            // authError is set by context
        }
    };

    if (user) {
        return (
            <div style={styles.panel}>
                <div style={styles.title}>Signed in</div>
                <div style={styles.email}>{user.email}</div>
                <button
                    type="button"
                    style={styles.button}
                    disabled={isAuthenticating}
                    onClick={() => void handleLogout()}
                >
                    Sign out
                </button>
                {message && <div style={styles.message}>{message}</div>}
                {authError && <div style={styles.error}>{authError}</div>}
            </div>
        );
    }

    return (
        <div style={styles.panel}>
            <div style={styles.title}>
                {mode === "login" ? "Sign in" : "Create account"}
            </div>
            <label style={styles.label}>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    style={styles.input}
                />
            </label>
            <label style={styles.label}>
                Password
                <input
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    style={styles.input}
                />
            </label>
            <div style={styles.actions}>
                <button
                    type="button"
                    style={styles.button}
                    disabled={isAuthenticating || !email || !password}
                    onClick={() => void handleSubmit()}
                >
                    {mode === "login" ? "Sign in" : "Register"}
                </button>
                <button
                    type="button"
                    style={styles.secondaryButton}
                    disabled={isAuthenticating}
                    onClick={() => setMode(current => current === "login" ? "register" : "login")}
                >
                    {mode === "login" ? "Create account" : "Use existing account"}
                </button>
            </div>
            {authError && <div style={styles.error}>{authError}</div>}
        </div>
    );
}

const styles = {
    panel: {
        display: "grid",
        gap: 10,
        padding: 12,
        minWidth: 260
    },
    title: {
        fontSize: 13,
        fontWeight: 600,
        color: "#f7f7f2"
    },
    email: {
        fontSize: 12,
        color: "#c5cad3",
        wordBreak: "break-all"
    },
    label: {
        display: "grid",
        gap: 4,
        fontSize: 11,
        color: "#9aa3b2"
    },
    input: {
        border: "1px solid #4b5562",
        background: "#171a20",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit"
    },
    actions: {
        display: "grid",
        gap: 8
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    secondaryButton: {
        border: "none",
        background: "transparent",
        color: "#cbd5e1",
        borderRadius: 6,
        padding: "4px 0",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        textAlign: "left"
    },
    message: {
        fontSize: 12,
        color: "#86efac"
    },
    error: {
        fontSize: 12,
        color: "#fca5a5"
    }
} satisfies Record<string, import("react").CSSProperties>;
