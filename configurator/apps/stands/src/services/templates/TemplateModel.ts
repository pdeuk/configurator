import type {
    ProjectArtworkAsset,
    ProjectArtworkAssignment,
    ProjectDocument,
    ProjectFloorSettings,
    ProjectModule,
    ProjectSceneSettings
} from "../../models/ProjectModel";

export interface TemplateCategory {
    id: string;
    name: string;
}

/** Layout snapshot stored on templates — excludes project identity and workflow state. */
export interface ProjectTemplateSnapshot {
    schemaVersion: number;
    floor: ProjectFloorSettings;
    scene: ProjectSceneSettings;
    modules: ProjectModule[];
    artworkAssets: ProjectArtworkAsset[];
    artworkAssignments: ProjectArtworkAssignment[];
}

export interface StandTemplate {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    category: string;
    thumbnailUrl: string | null;
    projectSnapshot: ProjectTemplateSnapshot;
    createdAt: string;
    createdBy: string | null;
}

export interface CreateTemplateMetadata {
    name: string;
    description?: string;
    categoryId: string;
    thumbnailUrl?: string | null;
}

export interface InstantiateTemplateOptions {
    name?: string;
}

export const DEFAULT_TEMPLATE_CATEGORIES: TemplateCategory[] = [
    { id: "inline-booth", name: "Inline Booth" },
    { id: "corner-booth", name: "Corner Booth" },
    { id: "island-booth", name: "Island Booth" },
    { id: "custom", name: "Custom" }
];

export const DEFAULT_TEMPLATE_THUMBNAIL =
    "data:image/svg+xml;utf8,"
    + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200">'
        + '<rect width="320" height="200" fill="#252932"/>'
        + '<rect x="48" y="56" width="224" height="88" rx="8" fill="#3a4558" stroke="#8ea0b8"/>'
        + '<text x="160" y="108" fill="#dbe4f0" font-family="system-ui,sans-serif" font-size="16" text-anchor="middle">Stand Template</text>'
        + "</svg>"
    );

export function getTemplateCategoryName(categoryId: string): string {
    return DEFAULT_TEMPLATE_CATEGORIES.find(category => category.id === categoryId)?.name
        ?? categoryId;
}

export function isProjectTemplateSnapshot(value: unknown): value is ProjectTemplateSnapshot {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ProjectTemplateSnapshot>;

    return (
        typeof candidate.schemaVersion === "number" &&
        candidate.floor !== null &&
        typeof candidate.floor === "object" &&
        candidate.scene !== null &&
        typeof candidate.scene === "object" &&
        Array.isArray(candidate.modules) &&
        Array.isArray(candidate.artworkAssets) &&
        Array.isArray(candidate.artworkAssignments)
    );
}

export function isStandTemplate(value: unknown): value is StandTemplate {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<StandTemplate>;

    return (
        typeof candidate.id === "string" &&
        typeof candidate.organizationId === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.description === "string" &&
        typeof candidate.category === "string" &&
        (candidate.thumbnailUrl === null || typeof candidate.thumbnailUrl === "string") &&
        isProjectTemplateSnapshot(candidate.projectSnapshot) &&
        typeof candidate.createdAt === "string" &&
        (candidate.createdBy === null || typeof candidate.createdBy === "string")
    );
}

export type { ProjectDocument };
