export type AuditAction =
    | "project.created"
    | "project.deleted"
    | "project.opened"
    | "quote.exported"
    | "erp.exported"
    | "revision.created"
    | "manufacturing.exported";

export type AuditEntityType =
    | "project"
    | "quote"
    | "erp"
    | "revision"
    | "manufacturing";

export interface AuditEntry {
    id: string;
    userId: string | null;
    organizationId: string | null;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    timestamp: string;
}

export type ErrorSeverity = "error" | "warning" | "fatal";

export interface ErrorLogEntry {
    id: string;
    message: string;
    stack: string | null;
    severity: ErrorSeverity;
    context: string | null;
    timestamp: string;
    url: string | null;
}

/** Reserved hook for external monitoring (Sentry, Datadog, etc.). */
export interface ExternalMonitoringSink {
    captureException(error: unknown, context?: Record<string, unknown>): void;
    captureMessage(message: string, context?: Record<string, unknown>): void;
}

export type PerformanceMetricName =
    | "project.load"
    | "assets.load"
    | "scene.objectCount"
    | "export.quotePdf"
    | "export.manufacturingPdf"
    | "export.manufacturingJson"
    | "export.erp";

export interface PerformanceMetric {
    id: string;
    name: PerformanceMetricName;
    durationMs: number | null;
    value: number | null;
    metadata: Record<string, string | number | boolean | null>;
    timestamp: string;
}

export type LoadingScope = "project" | "assets" | "export";

export interface LoadingState {
    project: boolean;
    assets: boolean;
    export: boolean;
}

export const EMPTY_LOADING_STATE: LoadingState = {
    project: false,
    assets: false,
    export: false
};

export function formatAuditAction(action: AuditAction): string {
    switch (action) {
        case "project.created":
            return "Project created";
        case "project.deleted":
            return "Project deleted";
        case "project.opened":
            return "Project opened";
        case "quote.exported":
            return "Quote exported";
        case "erp.exported":
            return "ERP export";
        case "revision.created":
            return "Revision saved";
        case "manufacturing.exported":
            return "Manufacturing exported";
    }
}

export function formatAuditUser(entry: AuditEntry): string {
    if (!entry.userId) {
        return "Local user";
    }

    if (entry.userId.includes("@")) {
        return entry.userId;
    }

    return entry.userId.slice(0, 8);
}
