import type { ProjectDocument } from "../../models/ProjectModel";

export interface SharePermissions {
    view: boolean;
    duplicate: boolean;
}

export type ShareKind = "customer_review" | "guest_handoff";

export interface SharedProject {
    id: string;
    projectId: ProjectDocument["id"];
    shareToken: string;
    shareKind: ShareKind;
    createdAt: string;
    expiresAt: string;
    permissions: SharePermissions;
}

export interface SharedProjectRecord {
    shared: SharedProject;
    projectSnapshot: ProjectDocument;
    disabled: boolean;
}

export interface SharedProjectLoadResult {
    shared: SharedProject;
    project: ProjectDocument;
}

export interface CreateShareLinkOptions {
    expiresAt?: string;
    permissions?: Partial<SharePermissions>;
    shareKind?: ShareKind;
}

/** Reserved for Supabase `public_projects` / share links table migration. */
export interface SupabaseShareRecord {
    id: string;
    project_id: string;
    share_token: string;
    project_snapshot: ProjectDocument;
    permissions: SharePermissions;
    created_at: string;
    expires_at: string;
    disabled_at: string | null;
    organization_id: string | null;
}

export const DEFAULT_SHARE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export const DEFAULT_SHARE_PERMISSIONS: SharePermissions = {
    view: true,
    duplicate: false
};

export function buildSharePath(shareToken: string): string {
    return `/share/${shareToken}`;
}

export function buildShareUrl(shareToken: string, origin = window.location.origin): string {
    return `${origin}${buildSharePath(shareToken)}`;
}

export function parseShareTokenFromPath(pathname = window.location.pathname): string | null {
    const match = pathname.match(/^\/share\/([^/]+)\/?$/);
    return match?.[1] ?? null;
}
