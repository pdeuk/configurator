export type AnalyticsEventName =
    | "project.created"
    | "project.opened"
    | "project.completed"
    | "quote.created"
    | "quote.exported"
    | "customer.approved"
    | "customer.requested_changes"
    | "manufacturing.exported"
    | "template.used"
    | "catalog.item_used";

export interface AnalyticsEvent {
    id: string;
    organizationId: string;
    userId: string | null;
    event: AnalyticsEventName;
    entityType: string;
    entityId: string;
    metadata: Record<string, unknown>;
    timestamp: string;
}

export interface TrackEventInput {
    event: AnalyticsEventName;
    entityType: string;
    entityId: string;
    metadata?: Record<string, unknown>;
}

export interface DashboardMetrics {
    projects: {
        createdThisMonth: number;
        activeProjects: number;
        completedProjects: number;
    };
    sales: {
        quotesCreated: number;
        quoteValue: number;
        approvalRate: number;
    };
    customers: {
        activeCustomers: number;
        pendingApprovals: number;
    };
    products: {
        mostUsedTemplates: RankedUsageItem[];
        mostUsedComponents: RankedUsageItem[];
    };
}

export interface RankedUsageItem {
    entityId: string;
    label: string;
    count: number;
}

export interface ProjectActivityPoint {
    date: string;
    created: number;
    opened: number;
    completed: number;
}

export interface ProjectStats {
    points: ProjectActivityPoint[];
    totals: {
        created: number;
        opened: number;
        completed: number;
    };
}

export interface QuoteTrendPoint {
    date: string;
    quotesCreated: number;
    quotesExported: number;
    quoteValue: number;
}

export interface SalesStats {
    points: QuoteTrendPoint[];
    totals: {
        quotesCreated: number;
        quotesExported: number;
        quoteValue: number;
    };
}

export const ANALYTICS_EVENT_NAMES: AnalyticsEventName[] = [
    "project.created",
    "project.opened",
    "project.completed",
    "quote.created",
    "quote.exported",
    "customer.approved",
    "customer.requested_changes",
    "manufacturing.exported",
    "template.used",
    "catalog.item_used"
];

export function isAnalyticsEvent(value: unknown): value is AnalyticsEvent {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<AnalyticsEvent>;

    return (
        typeof candidate.id === "string" &&
        typeof candidate.organizationId === "string" &&
        (candidate.userId === null || typeof candidate.userId === "string") &&
        typeof candidate.event === "string" &&
        ANALYTICS_EVENT_NAMES.includes(candidate.event as AnalyticsEventName) &&
        typeof candidate.entityType === "string" &&
        typeof candidate.entityId === "string" &&
        candidate.metadata !== null &&
        typeof candidate.metadata === "object" &&
        typeof candidate.timestamp === "string"
    );
}

export function formatAnalyticsEventLabel(event: AnalyticsEventName): string {
    switch (event) {
        case "project.created":
            return "Project created";
        case "project.opened":
            return "Project opened";
        case "project.completed":
            return "Project completed";
        case "quote.created":
            return "Quote created";
        case "quote.exported":
            return "Quote exported";
        case "customer.approved":
            return "Customer approved";
        case "customer.requested_changes":
            return "Changes requested";
        case "manufacturing.exported":
            return "Manufacturing exported";
        case "template.used":
            return "Template used";
        case "catalog.item_used":
            return "Component used";
        default:
            return event;
    }
}

function startOfUtcDay(isoTimestamp: string): string {
    const date = new Date(isoTimestamp);
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
        .toISOString()
        .slice(0, 10);
}

export function groupEventsByUtcDay(dayCount: number): string[] {
    const days: string[] = [];
    const today = new Date();

    for (let offset = dayCount - 1; offset >= 0; offset -= 1) {
        const date = new Date(
            Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - offset)
        );
        days.push(date.toISOString().slice(0, 10));
    }

    return days;
}

export function countEventsByDay(
    events: AnalyticsEvent[],
    eventName: AnalyticsEventName,
    days: string[]
): Record<string, number> {
    const counts = Object.fromEntries(days.map(day => [day, 0])) as Record<string, number>;

    for (const event of events) {
        if (event.event !== eventName) {
            continue;
        }

        const day = startOfUtcDay(event.timestamp);

        if (day in counts) {
            counts[day] = (counts[day] ?? 0) + 1;
        }
    }

    return counts;
}

export function rankEntityUsage(
    events: AnalyticsEvent[],
    eventName: AnalyticsEventName,
    labelKey = "label",
    limit = 5
): RankedUsageItem[] {
    const counts = new Map<string, { label: string; count: number }>();

    for (const event of events) {
        if (event.event !== eventName) {
            continue;
        }

        const labelValue = event.metadata[labelKey];
        const label = typeof labelValue === "string" && labelValue.trim()
            ? labelValue.trim()
            : event.entityId;
        const existing = counts.get(event.entityId);

        if (existing) {
            existing.count += 1;
            if (label !== event.entityId) {
                existing.label = label;
            }
        } else {
            counts.set(event.entityId, { label, count: 1 });
        }
    }

    return [...counts.entries()]
        .map(([entityId, value]) => ({
            entityId,
            label: value.label,
            count: value.count
        }))
        .sort((left, right) => right.count - left.count)
        .slice(0, limit);
}

export function sumQuoteValue(events: AnalyticsEvent[]): number {
    return events
        .filter(event => event.event === "quote.created")
        .reduce((sum, event) => {
            const total = event.metadata.total;

            if (typeof total === "number" && Number.isFinite(total)) {
                return sum + total;
            }

            return sum;
        }, 0);
}

export function startOfCurrentMonthUtc(): Date {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export function isWithinDays(isoTimestamp: string, days: number): boolean {
    const timestamp = Date.parse(isoTimestamp);

    if (!Number.isFinite(timestamp)) {
        return false;
    }

    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return timestamp >= cutoff;
}
