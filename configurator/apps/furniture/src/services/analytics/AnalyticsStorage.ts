import type { AnalyticsEvent } from "./AnalyticsModel";
import { isAnalyticsEvent } from "./AnalyticsModel";

export interface AnalyticsStorage {
    appendEvent(event: AnalyticsEvent): Promise<AnalyticsEvent>;
    listEvents(
        organizationId: string,
        options?: {
            since?: string;
            limit?: number;
        }
    ): Promise<AnalyticsEvent[]>;
}

const EVENT_INDEX_PREFIX = "configurator:analytics:index:";
const EVENT_ITEM_PREFIX = "configurator:analytics:item:";
const MAX_LOCAL_EVENTS = 2500;

function eventIndexKey(organizationId: string): string {
    return `${EVENT_INDEX_PREFIX}${organizationId}`;
}

function eventItemKey(organizationId: string, eventId: string): string {
    return `${EVENT_ITEM_PREFIX}${organizationId}:${eventId}`;
}

function readEventIndex(organizationId: string): string[] {
    const raw = localStorage.getItem(eventIndexKey(organizationId));

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as string[];
    } catch {
        return [];
    }
}

function writeEventIndex(organizationId: string, eventIds: string[]): void {
    localStorage.setItem(eventIndexKey(organizationId), JSON.stringify(eventIds));
}

export class LocalAnalyticsStorage implements AnalyticsStorage {
    async appendEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
        localStorage.setItem(
            eventItemKey(event.organizationId, event.id),
            JSON.stringify(event)
        );

        const nextIndex = readEventIndex(event.organizationId).filter(id => id !== event.id);
        nextIndex.unshift(event.id);

        if (nextIndex.length > MAX_LOCAL_EVENTS) {
            const removed = nextIndex.splice(MAX_LOCAL_EVENTS);

            for (const removedId of removed) {
                localStorage.removeItem(eventItemKey(event.organizationId, removedId));
            }
        }

        writeEventIndex(event.organizationId, nextIndex);
        return event;
    }

    async listEvents(
        organizationId: string,
        options: { since?: string; limit?: number } = {}
    ): Promise<AnalyticsEvent[]> {
        const sinceMs = options.since ? Date.parse(options.since) : null;
        const limit = options.limit ?? MAX_LOCAL_EVENTS;
        const eventIds = readEventIndex(organizationId);
        const events: AnalyticsEvent[] = [];

        for (const eventId of eventIds) {
            if (events.length >= limit) {
                break;
            }

            const raw = localStorage.getItem(eventItemKey(organizationId, eventId));

            if (!raw) {
                continue;
            }

            try {
                const parsed = JSON.parse(raw) as unknown;

                if (!isAnalyticsEvent(parsed) || parsed.organizationId !== organizationId) {
                    continue;
                }

                if (sinceMs !== null && Number.isFinite(sinceMs)) {
                    const timestamp = Date.parse(parsed.timestamp);

                    if (!Number.isFinite(timestamp) || timestamp < sinceMs) {
                        continue;
                    }
                }

                events.push(parsed);
            } catch {
                continue;
            }
        }

        return events.sort((left, right) => right.timestamp.localeCompare(left.timestamp));
    }
}

export const localAnalyticsStorage = new LocalAnalyticsStorage();
