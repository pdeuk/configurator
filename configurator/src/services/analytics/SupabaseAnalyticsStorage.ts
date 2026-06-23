import { getSupabaseClient } from "../cloud/SupabaseClient";
import type { AnalyticsEvent } from "./AnalyticsModel";
import type { AnalyticsStorage } from "./AnalyticsStorage";

interface AnalyticsEventRow {
    id: string;
    organization_id: string;
    user_id: string | null;
    event: AnalyticsEvent["event"];
    entity_type: string;
    entity_id: string;
    metadata: Record<string, unknown>;
    timestamp: string;
}

function rowToEvent(row: AnalyticsEventRow): AnalyticsEvent {
    return {
        id: row.id,
        organizationId: row.organization_id,
        userId: row.user_id,
        event: row.event,
        entityType: row.entity_type,
        entityId: row.entity_id,
        metadata: row.metadata ?? {},
        timestamp: row.timestamp
    };
}

function eventToRow(event: AnalyticsEvent): AnalyticsEventRow {
    return {
        id: event.id,
        organization_id: event.organizationId,
        user_id: event.userId,
        event: event.event,
        entity_type: event.entityType,
        entity_id: event.entityId,
        metadata: event.metadata,
        timestamp: event.timestamp
    };
}

async function resolveCloudOrganizationId(userId: string): Promise<string> {
    const client = getSupabaseClient();

    if (!client) {
        return userId;
    }

    const { data, error } = await client
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return (data as { organization_id: string | null } | null)?.organization_id ?? userId;
}

export class SupabaseAnalyticsStorage implements AnalyticsStorage {
    private readonly userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    private async getOrganizationId(): Promise<string> {
        return resolveCloudOrganizationId(this.userId);
    }

    async appendEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data, error } = await client
            .from("analytics_events")
            .insert(eventToRow(event))
            .select("*")
            .single();

        if (error) {
            throw error;
        }

        return rowToEvent(data as AnalyticsEventRow);
    }

    async listEvents(
        organizationId: string,
        options: { since?: string; limit?: number } = {}
    ): Promise<AnalyticsEvent[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const resolvedOrganizationId = await this.getOrganizationId();

        if (resolvedOrganizationId !== organizationId) {
            return [];
        }

        let query = client
            .from("analytics_events")
            .select("*")
            .eq("organization_id", organizationId)
            .order("timestamp", { ascending: false });

        if (options.since) {
            query = query.gte("timestamp", options.since);
        }

        if (options.limit) {
            query = query.limit(options.limit);
        }

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return ((data ?? []) as AnalyticsEventRow[]).map(rowToEvent);
    }
}
