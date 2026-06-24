const MAX_ERROR_LOG_ENTRIES = 100;
const MAX_AUDIT_ENTRIES = 200;
const MAX_PERFORMANCE_ENTRIES = 150;

const ERROR_LOG_KEY = "configurator:system:error-log";
const AUDIT_LOG_KEY = "configurator:system:audit-log";
const PERFORMANCE_LOG_KEY = "configurator:system:performance-log";

function readList<T>(key: string): T[] {
    const raw = localStorage.getItem(key);

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as T[];
    } catch {
        return [];
    }
}

function writeList<T>(key: string, entries: T[]): void {
    localStorage.setItem(key, JSON.stringify(entries));
}

export function appendErrorLogEntry<T extends { id: string }>(entry: T): void {
    const next = readList<T>(ERROR_LOG_KEY).filter(item => item.id !== entry.id);
    next.unshift(entry);
    writeList(ERROR_LOG_KEY, next.slice(0, MAX_ERROR_LOG_ENTRIES));
}

export function readErrorLogEntries<T>(): T[] {
    return readList<T>(ERROR_LOG_KEY);
}

export function appendAuditEntry<T extends { id: string }>(entry: T): void {
    const next = readList<T>(AUDIT_LOG_KEY).filter(item => item.id !== entry.id);
    next.unshift(entry);
    writeList(AUDIT_LOG_KEY, next.slice(0, MAX_AUDIT_ENTRIES));
}

export function readAuditEntries<T>(): T[] {
    return readList<T>(AUDIT_LOG_KEY);
}

export function appendPerformanceMetric<T extends { id: string }>(entry: T): void {
    const next = readList<T>(PERFORMANCE_LOG_KEY).filter(item => item.id !== entry.id);
    next.unshift(entry);
    writeList(PERFORMANCE_LOG_KEY, next.slice(0, MAX_PERFORMANCE_ENTRIES));
}

export function readPerformanceMetrics<T>(): T[] {
    return readList<T>(PERFORMANCE_LOG_KEY);
}
