import { useEffect, useState } from "react";
import {
    auditService,
    formatAuditAction,
    formatAuditUser,
    errorTrackingService,
    type AuditEntry
} from "../../services/system";

export function ActivityLogTab() {
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadEntries = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const next = await auditService.listEntries(100);
            setEntries(next);
        } catch (loadError) {
            errorTrackingService.captureError(loadError, {
                context: "activity-log.load"
            });
            setError("Unable to load activity log.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadEntries();
    }, []);

    if (isLoading) {
        return <p style={styles.empty}>Loading activity log…</p>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h3 style={styles.title}>Activity Log</h3>
                    <p style={styles.subtitle}>
                        Recent organization actions tracked locally for audit and support.
                    </p>
                </div>
                <button type="button" style={styles.button} onClick={() => void loadEntries()}>
                    Refresh
                </button>
            </div>

            {entries.length === 0 ? (
                <p style={styles.empty}>No activity recorded yet.</p>
            ) : (
                <div style={styles.table}>
                    <div style={styles.tableHeader}>
                        <span>User</span>
                        <span>Action</span>
                        <span>Date</span>
                    </div>
                    {entries.map(entry => (
                        <div key={entry.id} style={styles.tableRow}>
                            <span>{formatAuditUser(entry)}</span>
                            <span>{formatAuditAction(entry.action)}</span>
                            <span>{new Date(entry.timestamp).toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            )}

            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    container: {
        display: "grid",
        gap: 12
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12
    },
    title: {
        margin: 0,
        fontSize: 14
    },
    subtitle: {
        margin: "4px 0 0",
        fontSize: 12,
        color: "#9aa3b2"
    },
    table: {
        display: "grid",
        gap: 6
    },
    tableHeader: {
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr 1fr",
        gap: 8,
        fontSize: 11,
        color: "#9aa3b2",
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        padding: "0 4px"
    },
    tableRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1.2fr 1fr",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#171b21",
        fontSize: 13
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    empty: {
        margin: 0,
        color: "#9aa3b2",
        fontSize: 13
    },
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 12
    }
};
