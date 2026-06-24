import type { ProjectDocument } from "../../models/ProjectModel";
import { getCloudStorageContext } from "../cloud/HybridProjectStorage";
import { isSupabaseConfigured } from "@configurator/core/cloud";
import { isBrowserOnline } from "@configurator/core/cloud";
import { getSettingsContext } from "../settings/SettingsService";
import { SupabaseTemplateStorage } from "./SupabaseTemplateStorage";
import type {
    CreateTemplateMetadata,
    InstantiateTemplateOptions,
    StandTemplate
} from "./TemplateModel";
import {
    extractTemplateSnapshot,
    instantiateProjectFromSnapshot
} from "./templateSnapshot";
import { localTemplateStorage, type TemplateStorage } from "./TemplateStorage";

function canUseCloudTemplates(): boolean {
    const { user } = getCloudStorageContext();
    return Boolean(isSupabaseConfigured() && user && isBrowserOnline());
}

function getStorage(): TemplateStorage {
    const { user } = getCloudStorageContext();

    if (canUseCloudTemplates() && user) {
        return new SupabaseTemplateStorage(user.id);
    }

    return localTemplateStorage;
}

function getActiveOrganizationId(): string {
    return getSettingsContext().organizationId;
}

function resolveCreatedBy(): string | null {
    const { user } = getCloudStorageContext();
    return user?.email ?? user?.id ?? null;
}

export class TemplateService {
    async listTemplates(): Promise<StandTemplate[]> {
        return getStorage().listTemplates(getActiveOrganizationId());
    }

    async getTemplate(templateId: string): Promise<StandTemplate | null> {
        return getStorage().getTemplate(getActiveOrganizationId(), templateId);
    }

    async createTemplateFromProject(
        project: ProjectDocument,
        metadata: CreateTemplateMetadata
    ): Promise<StandTemplate> {
        const template: StandTemplate = {
            id: crypto.randomUUID(),
            organizationId: getActiveOrganizationId(),
            name: metadata.name.trim(),
            description: metadata.description?.trim() ?? "",
            category: metadata.categoryId,
            thumbnailUrl: metadata.thumbnailUrl ?? null,
            projectSnapshot: extractTemplateSnapshot(project),
            createdAt: new Date().toISOString(),
            createdBy: resolveCreatedBy()
        };

        return getStorage().saveTemplate(template);
    }

    async deleteTemplate(templateId: string): Promise<void> {
        await getStorage().deleteTemplate(getActiveOrganizationId(), templateId);
    }

    async instantiateTemplate(
        templateId: string,
        options: InstantiateTemplateOptions = {}
    ): Promise<ProjectDocument> {
        const template = await this.getTemplate(templateId);

        if (!template) {
            throw new Error(`Template "${templateId}" was not found.`);
        }

        const projectId = crypto.randomUUID();
        const name = options.name?.trim() || `${template.name} Project`;

        return instantiateProjectFromSnapshot(template.projectSnapshot, {
            id: projectId,
            name
        });
    }
}

export const templateService = new TemplateService();

export function createTemplateFromProject(
    project: ProjectDocument,
    metadata: CreateTemplateMetadata
): Promise<StandTemplate> {
    return templateService.createTemplateFromProject(project, metadata);
}

export function listTemplates(): Promise<StandTemplate[]> {
    return templateService.listTemplates();
}

export function getTemplate(templateId: string): Promise<StandTemplate | null> {
    return templateService.getTemplate(templateId);
}

export function deleteTemplate(templateId: string): Promise<void> {
    return templateService.deleteTemplate(templateId);
}

export function instantiateTemplate(
    templateId: string,
    options?: InstantiateTemplateOptions
): Promise<ProjectDocument> {
    return templateService.instantiateTemplate(templateId, options);
}
