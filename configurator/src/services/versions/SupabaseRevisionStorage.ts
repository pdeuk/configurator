import type { ProjectDocument } from "../../models/ProjectModel";
import { normalizeProjectDocument } from "../../lib/projectSerialization";
import { getSupabaseClient } from "../cloud/SupabaseClient";
import type { RevisionStorage } from "./RevisionStorage";
import type { ProjectRevision } from "./VersionModel";

interface ProjectRevisionRow {
    id: string;
    project_id: string;
    version_number: number;
    snapshot_json: ProjectDocument;
    message: string;
    created_at: string;
    created_by: string;
}

function mapRevisionRow(row: ProjectRevisionRow): ProjectRevision | null {
    const snapshot = normalizeProjectDocument(row.snapshot_json);

    if (!snapshot) {
        return null;
    }

    return {
        id: row.id,
        projectId: row.project_id,
        versionNumber: row.version_number,
        createdAt: row.created_at,
        createdBy: row.created_by,
        message: row.message,
        snapshot
    };
}

function cloneProjectDocument(project: ProjectDocument): ProjectDocument {
    return JSON.parse(JSON.stringify(project)) as ProjectDocument;
}

export class SupabaseRevisionStorage implements RevisionStorage {
    async createRevision(
        project: ProjectDocument,
        message: string,
        createdBy: string
    ): Promise<ProjectRevision> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { data: latestRows, error: latestError } = await client
            .from("project_revisions")
            .select("version_number")
            .eq("project_id", project.id)
            .order("version_number", { ascending: false })
            .limit(1);

        if (latestError) {
            throw latestError;
        }

        const latestVersion = (latestRows?.[0] as { version_number: number } | undefined)
            ?.version_number ?? 0;
        const timestamp = new Date().toISOString();
        const row: ProjectRevisionRow = {
            id: crypto.randomUUID(),
            project_id: project.id,
            version_number: latestVersion + 1,
            snapshot_json: cloneProjectDocument(project),
            message: message.trim(),
            created_at: timestamp,
            created_by: createdBy
        };

        const { error } = await client.from("project_revisions").insert(row);

        if (error) {
            throw error;
        }

        const revision = mapRevisionRow(row);

        if (!revision) {
            throw new Error("Failed to serialize created revision.");
        }

        return revision;
    }

    async getRevisions(projectId: string): Promise<ProjectRevision[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from("project_revisions")
            .select("*")
            .eq("project_id", projectId)
            .order("version_number", { ascending: false });

        if (error) {
            throw error;
        }

        return (data as ProjectRevisionRow[])
            .map(mapRevisionRow)
            .filter((revision): revision is ProjectRevision => revision !== null);
    }

    async getRevision(revisionId: string): Promise<ProjectRevision | null> {
        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data, error } = await client
            .from("project_revisions")
            .select("*")
            .eq("id", revisionId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return mapRevisionRow(data as ProjectRevisionRow);
    }
}
