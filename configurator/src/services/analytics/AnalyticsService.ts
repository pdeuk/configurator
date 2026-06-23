import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { isSupabaseConfigured } from "../cloud/SupabaseClient";
import { isBrowserOnline } from "../cloud/syncStatus";
import { listCustomers } from "../customer/CustomerService";
import { getSettingsContext } from "../settings/SettingsService";
import { resolveSystemActorContext } from "../system/systemContext";
import type {
    AnalyticsEvent,
    DashboardMetrics,
    ProjectStats,
    SalesStats,
    TrackEventInput
} from "./AnalyticsModel";
import {
    countEventsByDay,
    groupEventsByUtcDay,
    isWithinDays,
    rankEntityUsage,
    startOfCurrentMonthUtc,
    sumQuoteValue
} from "./AnalyticsModel";
import {
    localAnalyticsStorage,
    type AnalyticsStorage
} from "./AnalyticsStorage";
import { SupabaseAnalyticsStorage } from "./SupabaseAnalyticsStorage";

const DEFAULT_STATS_DAYS = 14;
const ACTIVE_PROJECT_WINDOW_DAYS = 30;

function canUseCloudAnalytics(): boolean {
    const { user } = getCloudStorageContext();
    return Boolean(isSupabaseConfigured() && user && isBrowserOnline());
}

function getAnalyticsStorage(): AnalyticsStorage {
    const { user } = getCloudStorageContext();

    if (canUseCloudAnalytics() && user) {
        return new SupabaseAnalyticsStorage(user.id);
    }

    return localAnalyticsStorage;
}

function getActiveOrganizationId(): string {
    return getSettingsContext().organizationId;
}

function resolveProjectId(event: AnalyticsEvent): string | null {
    const metadataProjectId = event.metadata.projectId;

    if (typeof metadataProjectId === "string" && metadataProjectId.trim()) {
        return metadataProjectId;
    }

    if (event.entityType === "project") {
        return event.entityId;
    }

    return null;
}

function uniqueProjectIds(events: AnalyticsEvent[], eventName: AnalyticsEvent["event"]): Set<string> {
    const projectIds = new Set<string>();

    for (const event of events) {
        if (event.event !== eventName) {
            continue;
        }

        const projectId = resolveProjectId(event);

        if (projectId) {
            projectIds.add(projectId);
        }
    }

    return projectIds;
}

function countQuoteValueByDay(
    events: AnalyticsEvent[],
    days: string[]
): Record<string, number> {
    const totals = Object.fromEntries(days.map(day => [day, 0])) as Record<string, number>;

    for (const event of events) {
        if (event.event !== "quote.created") {
            continue;
        }

        const day = event.timestamp.slice(0, 10);
        const total = event.metadata.total;

        if (!(day in totals) || typeof total !== "number" || !Number.isFinite(total)) {
            continue;
        }

        totals[day] = (totals[day] ?? 0) + total;
    }

    return totals;
}

export class AnalyticsService {
    async trackEvent(input: TrackEventInput): Promise<AnalyticsEvent> {
        const { organizationId, userId } = resolveSystemActorContext();
        const event: AnalyticsEvent = {
            id: crypto.randomUUID(),
            organizationId,
            userId,
            event: input.event,
            entityType: input.entityType,
            entityId: input.entityId,
            metadata: input.metadata ?? {},
            timestamp: new Date().toISOString()
        };

        const saved = await getAnalyticsStorage().appendEvent(event);

        if (!canUseCloudAnalytics()) {
            return saved;
        }

        try {
            return await localAnalyticsStorage.appendEvent(saved);
        } catch {
            return saved;
        }
    }

    async listEvents(options?: { since?: string; limit?: number }): Promise<AnalyticsEvent[]> {
        const organizationId = getActiveOrganizationId();
        const storage = getAnalyticsStorage();
        const events = await storage.listEvents(organizationId, options);

        if (canUseCloudAnalytics()) {
            try {
                const localEvents = await localAnalyticsStorage.listEvents(organizationId, options);
                const merged = new Map<string, AnalyticsEvent>();

                for (const event of [...events, ...localEvents]) {
                    merged.set(event.id, event);
                }

                return [...merged.values()].sort((left, right) =>
                    right.timestamp.localeCompare(left.timestamp)
                );
            } catch {
                return events;
            }
        }

        return events;
    }

    async getDashboardMetrics(): Promise<DashboardMetrics> {
        const organizationId = getActiveOrganizationId();
        const monthStart = startOfCurrentMonthUtc().toISOString();
        const activeWindowStart = new Date(
            Date.now() - ACTIVE_PROJECT_WINDOW_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        const [monthEvents, activeWindowEvents, customers] = await Promise.all([
            this.listEvents({ since: monthStart, limit: 5000 }),
            this.listEvents({ since: activeWindowStart, limit: 5000 }),
            listCustomers()
        ]);

        const createdThisMonth = monthEvents.filter(event => event.event === "project.created").length;
        const openedProjects = uniqueProjectIds(activeWindowEvents, "project.opened");
        const completedProjects = uniqueProjectIds(
            await this.listEvents({ limit: 5000 }),
            "project.completed"
        );

        for (const projectId of completedProjects) {
            openedProjects.delete(projectId);
        }

        const quoteEvents = monthEvents.filter(
            event => event.event === "quote.created" || event.event === "quote.exported"
        );
        const quotesCreated = monthEvents.filter(event => event.event === "quote.created").length;
        const approvals = monthEvents.filter(event => event.event === "customer.approved").length;
        const changeRequests = monthEvents.filter(
            event => event.event === "customer.requested_changes"
        ).length;
        const approvalDenominator = approvals + changeRequests;

        const quotedProjectIds = new Set<string>();
        const approvedProjectIds = new Set<string>();

        for (const event of quoteEvents) {
            const projectId = resolveProjectId(event);

            if (projectId) {
                quotedProjectIds.add(projectId);
            }
        }

        for (const event of monthEvents) {
            if (event.event !== "customer.approved") {
                continue;
            }

            const projectId = resolveProjectId(event);

            if (projectId) {
                approvedProjectIds.add(projectId);
            }
        }

        let pendingApprovals = 0;

        for (const projectId of quotedProjectIds) {
            if (!approvedProjectIds.has(projectId)) {
                pendingApprovals += 1;
            }
        }

        const activeCustomers = customers.filter(customer => customer.organizationId === organizationId)
            .length;

        const allEvents = await this.listEvents({ limit: 5000 });

        return {
            projects: {
                createdThisMonth,
                activeProjects: openedProjects.size,
                completedProjects: completedProjects.size
            },
            sales: {
                quotesCreated,
                quoteValue: sumQuoteValue(monthEvents),
                approvalRate: approvalDenominator > 0 ? approvals / approvalDenominator : 0
            },
            customers: {
                activeCustomers,
                pendingApprovals
            },
            products: {
                mostUsedTemplates: rankEntityUsage(allEvents, "template.used"),
                mostUsedComponents: rankEntityUsage(allEvents, "catalog.item_used")
            }
        };
    }

    async getProjectStats(dayCount = DEFAULT_STATS_DAYS): Promise<ProjectStats> {
        const since = new Date(Date.now() - dayCount * 24 * 60 * 60 * 1000).toISOString();
        const events = await this.listEvents({ since, limit: 5000 });
        const days = groupEventsByUtcDay(dayCount);
        const createdByDay = countEventsByDay(events, "project.created", days);
        const openedByDay = countEventsByDay(events, "project.opened", days);
        const completedByDay = countEventsByDay(events, "project.completed", days);

        const points = days.map(date => ({
            date,
            created: createdByDay[date] ?? 0,
            opened: openedByDay[date] ?? 0,
            completed: completedByDay[date] ?? 0
        }));

        return {
            points,
            totals: {
                created: events.filter(event => event.event === "project.created").length,
                opened: events.filter(event => event.event === "project.opened").length,
                completed: events.filter(event => event.event === "project.completed").length
            }
        };
    }

    async getSalesStats(dayCount = DEFAULT_STATS_DAYS): Promise<SalesStats> {
        const since = new Date(Date.now() - dayCount * 24 * 60 * 60 * 1000).toISOString();
        const events = await this.listEvents({ since, limit: 5000 });
        const days = groupEventsByUtcDay(dayCount);
        const createdByDay = countEventsByDay(events, "quote.created", days);
        const exportedByDay = countEventsByDay(events, "quote.exported", days);
        const valueByDay = countQuoteValueByDay(events, days);

        const points = days.map(date => ({
            date,
            quotesCreated: createdByDay[date] ?? 0,
            quotesExported: exportedByDay[date] ?? 0,
            quoteValue: valueByDay[date] ?? 0
        }));

        return {
            points,
            totals: {
                quotesCreated: events.filter(event => event.event === "quote.created").length,
                quotesExported: events.filter(event => event.event === "quote.exported").length,
                quoteValue: sumQuoteValue(events.filter(event => isWithinDays(event.timestamp, dayCount)))
            }
        };
    }
}

export const analyticsService = new AnalyticsService();

export function trackEvent(input: TrackEventInput): Promise<AnalyticsEvent> {
    return analyticsService.trackEvent(input);
}

export function getDashboardMetrics(): Promise<DashboardMetrics> {
    return analyticsService.getDashboardMetrics();
}

export function getProjectStats(dayCount?: number): Promise<ProjectStats> {
    return analyticsService.getProjectStats(dayCount);
}

export function getSalesStats(dayCount?: number): Promise<SalesStats> {
    return analyticsService.getSalesStats(dayCount);
}
