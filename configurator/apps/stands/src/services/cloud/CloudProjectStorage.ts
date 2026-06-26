import type { ProjectDocument, ProjectListItem } from "../../models/ProjectModel";
import { normalizeProjectDocument } from "../../lib/projectSerialization";
import type { StorageService } from "../StorageService";
import type { ProjectRow } from "./cloudTypes";
import { getSupabaseClient } from "@configurator/core/cloud";

function parseProjectRow(row: ProjectRow): ProjectDocument | null {
    return normalizeProjectDocument(row.document_json);
}

export class CloudProjectStorage implements StorageService {
    private readonly userId: string;

    constructor(userId: string) {
        this.userId = userId;
    }

    loadProjectSync(_projectId: string): ProjectDocument | null {
        return null;
    }

    saveProjectSync(_project: ProjectDocument): void {
        throw new Error("Cloud project storage requires async saveProject().");
    }

    async loadProject(projectId: string): Promise<ProjectDocument | null> {
        const client = getSupabaseClient();

        if (!client) {
            return null;
        }

        const { data, error } = await client
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .eq("user_id", this.userId)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return parseProjectRow(data as ProjectRow);
    }

    async saveProject(project: ProjectDocument): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const timestamp = new Date().toISOString();
        const row: ProjectRow = {
            id: project.id,
            user_id: this.userId,
            name: project.name,
            document_json: {
                ...project,
                updatedAt: timestamp
            },
            created_at: project.createdAt,
            updated_at: timestamp
        };

        const { error } = await client
            .from("projects")
            .upsert(row, { onConflict: "id" });

        if (error) {
            throw error;
        }
    }

    async deleteProject(projectId: string): Promise<void> {
        const client = getSupabaseClient();

        if (!client) {
            throw new Error("Supabase is not configured.");
        }

        const { error } = await client
            .from("projects")
            .delete()
            .eq("id", projectId)
            .eq("user_id", this.userId);

        if (error) {
            throw error;
        }
    }

    async listProjects(): Promise<ProjectDocument[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from("projects")
            .select("*")
            .eq("user_id", this.userId)
            .order("updated_at", { ascending: false });

        if (error) {
            throw error;
        }

        return (data as ProjectRow[])
            .map(parseProjectRow)
            .filter((document): document is ProjectDocument => document !== null);
    }

    async listProjectSummaries(): Promise<ProjectListItem[]> {
        const client = getSupabaseClient();

        if (!client) {
            return [];
        }

        const { data, error } = await client
            .from("projects")
            .select("id,name,created_at,updated_at")
            .eq("user_id", this.userId)
            .order("updated_at", { ascending: false });

        if (error) {
            throw error;
        }

        return (data ?? []).map(row => ({
            id: String(row.id),
            name: String(row.name),
            createdAt: String(row.created_at),
            updatedAt: String(row.updated_at),
            ownership: {
                userId: this.userId,
                organizationId: null
            },
            quote: {
                quoteId: null,
                quoteNumber: null,
                status: null
            },
            bom: {
                generatedAt: null,
                revision: null,
                lines: []
            },
            moduleCount: null,
            floorWidth: null,
            floorDepth: null
        }));
    }
}
