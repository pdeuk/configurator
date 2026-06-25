import { useCallback, useEffect, useRef, useState } from "react";
import { notificationService, type OrganizationNotification } from "../../services/notifications/NotificationService";
import { useCloudSession } from "../cloud";

export function NotificationBell() {
    const { user } = useCloudSession();
    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState<OrganizationNotification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter(entry => !entry.readAt).length;

    const loadNotifications = useCallback(async () => {
        if (!user) {
            setNotifications([]);
            return;
        }

        setIsLoading(true);

        try {
            const entries = await notificationService.listRecent(user.id);
            setNotifications(entries);
        } catch (error) {
            console.warn("Notification load failed.", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        void loadNotifications();
        const interval = window.setInterval(() => {
            void loadNotifications();
        }, 30000);

        return () => {
            window.clearInterval(interval);
        };
    }, [loadNotifications]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            if (!containerRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        window.addEventListener("mousedown", handlePointerDown);

        return () => {
            window.removeEventListener("mousedown", handlePointerDown);
        };
    }, [open]);

    if (!user) {
        return null;
    }

    return (
        <div ref={containerRef} style={styles.container}>
            <button
                type="button"
                style={styles.button}
                aria-label="Notifications"
                onClick={() => {
                    setOpen(current => !current);
                    void loadNotifications();
                }}
            >
                Notifications
                {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
            </button>
            {open && (
                <div style={styles.panel}>
                    <div style={styles.panelHeader}>
                        <span style={styles.panelTitle}>Notifications</span>
                        {unreadCount > 0 && (
                            <button
                                type="button"
                                style={styles.markAll}
                                onClick={() => {
                                    void notificationService.markAllRead(user.id).then(() => {
                                        void loadNotifications();
                                    });
                                }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    {isLoading ? (
                        <p style={styles.empty}>Loading…</p>
                    ) : notifications.length === 0 ? (
                        <p style={styles.empty}>No notifications yet.</p>
                    ) : (
                        <div style={styles.list}>
                            {notifications.map(entry => (
                                <button
                                    key={entry.id}
                                    type="button"
                                    style={{
                                        ...styles.item,
                                        ...(entry.readAt ? styles.itemRead : undefined)
                                    }}
                                    onClick={() => {
                                        if (!entry.readAt) {
                                            void notificationService.markRead(entry.id).then(() => {
                                                void loadNotifications();
                                            });
                                        }
                                    }}
                                >
                                    <div style={styles.itemTitle}>{entry.title}</div>
                                    <div style={styles.itemBody}>{entry.body}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        position: "relative" as const
    },
    button: {
        position: "relative" as const,
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    badge: {
        position: "absolute" as const,
        top: -6,
        right: -6,
        minWidth: 18,
        height: 18,
        borderRadius: 999,
        background: "#ef4444",
        color: "#fff",
        fontSize: 11,
        fontWeight: 700,
        display: "grid",
        placeItems: "center",
        padding: "0 4px"
    },
    panel: {
        position: "absolute" as const,
        top: "calc(100% + 8px)",
        right: 0,
        width: 320,
        maxHeight: 360,
        overflowY: "auto" as const,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#20242b",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.35)",
        zIndex: 40
    },
    panelHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        padding: "12px 14px",
        borderBottom: "1px solid #3b414a"
    },
    panelTitle: {
        fontSize: 13,
        fontWeight: 700
    },
    markAll: {
        border: "none",
        background: "transparent",
        color: "#93c5fd",
        font: "inherit",
        fontSize: 12,
        cursor: "pointer"
    },
    list: {
        display: "grid"
    },
    item: {
        display: "grid",
        gap: 4,
        padding: "12px 14px",
        border: "none",
        borderBottom: "1px solid #2d3440",
        background: "transparent",
        color: "#f7f7f2",
        textAlign: "left" as const,
        cursor: "pointer",
        font: "inherit"
    },
    itemRead: {
        opacity: 0.65
    },
    itemTitle: {
        fontSize: 13,
        fontWeight: 600
    },
    itemBody: {
        fontSize: 12,
        color: "#c5cad3",
        lineHeight: 1.4
    },
    empty: {
        margin: 0,
        padding: 16,
        fontSize: 13,
        color: "#9aa3b2"
    }
} satisfies Record<string, import("react").CSSProperties>;
