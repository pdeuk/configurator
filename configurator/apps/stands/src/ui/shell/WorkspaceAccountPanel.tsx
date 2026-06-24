import { useState } from "react";
import { Link } from "react-router-dom";
import { formatCloudSyncStatus, isSupabaseConfigured } from "../../services/cloud";
import { formatOrganizationRole } from "../../services/auth";
import { usePermissions } from "../auth";
import { AuthPanel, useCloudSession } from "../cloud";
import { useProjectSession } from "../projects/projectSession";
import { isLocalDemoMode } from "../../app/localDemoMode";

interface WorkspaceAccountPanelProps {
    onExit: () => void;
}

export function WorkspaceAccountPanel({ onExit }: WorkspaceAccountPanelProps) {
    const {
        isConfigured,
        user,
        syncStatus,
        logout,
        isAuthenticating,
        importLocalProjects
    } = useCloudSession();
    const { refreshProjects, openManager } = useProjectSession();
    const { role } = usePermissions();
    const [message, setMessage] = useState<string | null>(null);
    const showLocalModeBadge = !isSupabaseConfigured() && isLocalDemoMode();

    const handleSignOut = async () => {
        setMessage(null);

        try {
            await logout();
            setMessage("Signed out.");
        } catch {
            setMessage("Unable to sign out.");
        }
    };

    const handleImportToCloud = async () => {
        setMessage(null);

        try {
            const result = await importLocalProjects();
            await refreshProjects();
            setMessage(
                `Imported ${result.importedProjects} project(s) to the cloud. Use Project → Open project to browse them.`
            );
            if (result.importedProjects > 0) {
                openManager();
            }
        } catch (importError) {
            setMessage(
                importError instanceof Error
                    ? importError.message
                    : "Import failed."
            );
        }
    };

    return (
        <aside style={styles.panel}>
            <div style={styles.header}>
                <div>
                    <div style={styles.headerLabel}>Account</div>
                    <h2 style={styles.heading}>Workspace</h2>
                </div>
                {isConfigured && (
                    <span style={styles.syncBadge} data-status={syncStatus}>
                        {formatCloudSyncStatus(syncStatus)}
                    </span>
                )}
            </div>

            {showLocalModeBadge && (
                <div style={styles.localBanner}>
                    <strong>Local mode</strong>
                    <span>Projects are stored in this browser only.</span>
                </div>
            )}

            {isConfigured && user ? (
                <div style={styles.accountCard}>
                    <div style={styles.email}>{user.email}</div>
                    <div style={styles.meta}>{formatOrganizationRole(role)}</div>
                    <div style={styles.actions}>
                        <button
                            type="button"
                            style={styles.secondaryButton}
                            disabled={isAuthenticating}
                            onClick={() => void handleImportToCloud()}
                        >
                            Import to cloud
                        </button>
                        <button
                            type="button"
                            style={styles.secondaryButton}
                            disabled={isAuthenticating}
                            onClick={() => void handleSignOut()}
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            ) : isConfigured ? (
                <div style={styles.authSection}>
                    <p style={styles.helper}>
                        Sign in to sync projects with your organization.
                    </p>
                    <AuthPanel onClose={() => undefined} />
                    <p style={styles.helper}>
                        Invited?{" "}
                        <Link to="/join" style={styles.link}>
                            Create account
                        </Link>
                    </p>
                </div>
            ) : (
                <p style={styles.helper}>
                    Cloud account controls are available when Supabase is configured.
                </p>
            )}

            {message && <p style={styles.message}>{message}</p>}

            <button
                type="button"
                style={styles.exitButton}
                onClick={onExit}
            >
                Exit
            </button>
        </aside>
    );
}

const styles = {
    panel: {
        flexShrink: 0,
        width: "100%",
        boxSizing: "border-box",
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 16,
        display: "grid",
        gap: 12
    },
    header: {
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12
    },
    headerLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    heading: {
        margin: "4px 0 0",
        fontSize: 16,
        fontWeight: 600
    },
    syncBadge: {
        fontSize: 10,
        fontWeight: 700,
        borderRadius: 999,
        padding: "5px 8px",
        whiteSpace: "nowrap",
        color: "#cbd5e1",
        background: "#2d3440",
        border: "1px solid #4b5562"
    },
    localBanner: {
        display: "grid",
        gap: 4,
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #854d0e",
        background: "rgba(66, 32, 6, 0.35)",
        fontSize: 12,
        color: "#fde68a"
    },
    accountCard: {
        display: "grid",
        gap: 8,
        padding: "12px 0 4px",
        borderTop: "1px solid #3b414a"
    },
    email: {
        fontSize: 14,
        fontWeight: 600,
        wordBreak: "break-all"
    },
    meta: {
        fontSize: 12,
        color: "#9aa3b2"
    },
    actions: {
        display: "grid",
        gap: 8,
        paddingTop: 4
    },
    authSection: {
        display: "grid",
        gap: 8,
        borderTop: "1px solid #3b414a",
        paddingTop: 8
    },
    helper: {
        margin: 0,
        fontSize: 12,
        color: "#9aa3b2",
        lineHeight: 1.5
    },
    link: {
        color: "#93c5fd",
        textDecoration: "none"
    },
    secondaryButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        textAlign: "left"
    },
    message: {
        margin: 0,
        fontSize: 12,
        color: "#86efac"
    },
    exitButton: {
        border: "1px solid #64748b",
        background: "#334155",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        fontWeight: 600
    }
} satisfies Record<string, import("react").CSSProperties>;
