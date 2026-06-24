export type CloudSyncStatus =
    | "local"
    | "synced"
    | "syncing"
    | "offline"
    | "error";

let currentStatus: CloudSyncStatus = "local";
const listeners = new Set<(status: CloudSyncStatus) => void>();

export function getCloudSyncStatus(): CloudSyncStatus {
    return currentStatus;
}

export function setCloudSyncStatus(status: CloudSyncStatus): void {
    if (currentStatus === status) {
        return;
    }

    currentStatus = status;
    listeners.forEach(listener => listener(status));
}

export function subscribeCloudSyncStatus(
    listener: (status: CloudSyncStatus) => void
): () => void {
    listeners.add(listener);
    listener(currentStatus);

    return () => {
        listeners.delete(listener);
    };
}

export function isBrowserOnline(): boolean {
    return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function installOnlineStatusListeners(): () => void {
    if (typeof window === "undefined") {
        return () => undefined;
    }

    const handleStatusChange = () => {
        if (!isBrowserOnline() && currentStatus !== "syncing") {
            setCloudSyncStatus("offline");
        }
    };

    window.addEventListener("online", handleStatusChange);
    window.addEventListener("offline", handleStatusChange);

    return () => {
        window.removeEventListener("online", handleStatusChange);
        window.removeEventListener("offline", handleStatusChange);
    };
}

export function formatCloudSyncStatus(status: CloudSyncStatus): string {
    switch (status) {
        case "local":
            return "Local only";
        case "synced":
            return "Synced";
        case "syncing":
            return "Syncing…";
        case "offline":
            return "Offline";
        case "error":
            return "Sync error";
    }
}
