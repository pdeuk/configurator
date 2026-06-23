import {
    appendErrorLogEntry,
    readErrorLogEntries
} from "./systemStorage";
import type {
    ErrorLogEntry,
    ErrorSeverity,
    ExternalMonitoringSink
} from "./SystemModel";

function normalizeError(error: unknown): { message: string; stack: string | null } {
    if (error instanceof Error) {
        return {
            message: error.message || error.name,
            stack: error.stack ?? null
        };
    }

    if (typeof error === "string") {
        return { message: error, stack: null };
    }

    try {
        return { message: JSON.stringify(error), stack: null };
    } catch {
        return { message: "Unknown error", stack: null };
    }
}

export class ErrorTrackingService {
    private monitoringSink: ExternalMonitoringSink | null = null;
    private globalHandlersInstalled = false;

    setMonitoringSink(sink: ExternalMonitoringSink | null): void {
        this.monitoringSink = sink;
    }

    installGlobalHandlers(): void {
        if (this.globalHandlersInstalled || typeof window === "undefined") {
            return;
        }

        this.globalHandlersInstalled = true;

        window.addEventListener("error", event => {
            this.captureError(event.error ?? event.message, {
                context: "window.error",
                severity: "fatal"
            });
        });

        window.addEventListener("unhandledrejection", event => {
            this.captureError(event.reason, {
                context: "window.unhandledrejection",
                severity: "error"
            });
        });
    }

    captureError(
        error: unknown,
        options: {
            context?: string;
            severity?: ErrorSeverity;
        } = {}
    ): ErrorLogEntry {
        const normalized = normalizeError(error);
        const entry: ErrorLogEntry = {
            id: crypto.randomUUID(),
            message: normalized.message,
            stack: normalized.stack,
            severity: options.severity ?? "error",
            context: options.context ?? null,
            timestamp: new Date().toISOString(),
            url: typeof window !== "undefined" ? window.location.href : null
        };

        appendErrorLogEntry(entry);
        console.warn("[ErrorTracking]", entry.context ?? "application", entry.message);

        this.monitoringSink?.captureException(error, {
            context: entry.context,
            severity: entry.severity,
            url: entry.url
        });

        return entry;
    }

    captureMessage(
        message: string,
        options: {
            context?: string;
            severity?: ErrorSeverity;
        } = {}
    ): ErrorLogEntry {
        const entry: ErrorLogEntry = {
            id: crypto.randomUUID(),
            message,
            stack: null,
            severity: options.severity ?? "warning",
            context: options.context ?? null,
            timestamp: new Date().toISOString(),
            url: typeof window !== "undefined" ? window.location.href : null
        };

        appendErrorLogEntry(entry);
        this.monitoringSink?.captureMessage(message, {
            context: entry.context,
            severity: entry.severity
        });

        return entry;
    }

    listErrors(limit = 50): ErrorLogEntry[] {
        return readErrorLogEntries<ErrorLogEntry>().slice(0, limit);
    }
}

export const errorTrackingService = new ErrorTrackingService();
