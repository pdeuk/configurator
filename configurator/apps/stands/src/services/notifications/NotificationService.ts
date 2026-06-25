import { getSupabaseClient } from "@configurator/core/cloud";

export interface OrganizationNotification {
    id: string;
    organizationId: string;
    recipientUserId: string;
    type: string;
    title: string;
    body: string;
    projectId: string | null;
    reviewId: string | null;
    readAt: string | null;
    createdAt: string;
}

interface NotificationRow {
    id: string;
    organization_id: string;
    recipient_user_id: string;
    type: string;
    title: string;
    body: string;
    project_id: string | null;
    review_id: string | null;
    read_at: string | null;
    created_at: string;
}

function mapRow(row: NotificationRow): OrganizationNotification {
    return {
        id: row.id,
        organizationId: row.organization_id,
        recipientUserId: row.recipient_user_id,
        type: row.type,
        title: row.title,
        body: row.body,
        projectId: row.project_id,
        reviewId: row.review_id,
        readAt: row.read_at,
        createdAt: row.created_at
    };
}

export class NotificationService {
    async listUnread(userId: string): Promise<OrganizationNotification[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from("organization_notifications")
            .select("*")
            .eq("recipient_user_id", userId)
            .is("read_at", null)
            .order("created_at", { ascending: false })
            .limit(30);

        if (error) {
            throw error;
        }

        return ((data ?? []) as NotificationRow[]).map(mapRow);
    }

    async listRecent(userId: string, limit = 30): Promise<OrganizationNotification[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from("organization_notifications")
            .select("*")
            .eq("recipient_user_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (error) {
            throw error;
        }

        return ((data ?? []) as NotificationRow[]).map(mapRow);
    }

    async markRead(notificationId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            return;
        }

        const { error } = await client
            .from("organization_notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("id", notificationId);

        if (error) {
            throw error;
        }
    }

    async markAllRead(userId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            return;
        }

        const { error } = await client
            .from("organization_notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("recipient_user_id", userId)
            .is("read_at", null);

        if (error) {
            throw error;
        }
    }
}

export const notificationService = new NotificationService();
