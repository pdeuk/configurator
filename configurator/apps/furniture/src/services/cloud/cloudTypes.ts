import type { ProjectDocument } from "../../models/ProjectModel";
import type { SharePermissions } from "../sharing/ShareModel";

export interface ProfileRow {
    id: string;
    email: string;
    created_at: string;
}

export interface ProjectRow {
    id: string;
    user_id: string;
    name: string;
    document_json: ProjectDocument;
    created_at: string;
    updated_at: string;
}

export interface ProjectShareRow {
    id: string;
    project_id: string;
    token: string;
    permissions: SharePermissions;
    expires_at: string;
    disabled: boolean;
    project_snapshot: ProjectDocument | null;
    created_at: string;
}

export interface ArtworkAssetRow {
    id: string;
    user_id: string;
    filename: string;
    mime_type: string;
    storage_path: string;
    metadata_json: Record<string, unknown>;
    created_at: string;
}

export const ARTWORK_STORAGE_BUCKET = "project-artwork";
