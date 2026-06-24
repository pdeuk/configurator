import type { StandTemplate } from "./TemplateModel";
import { isStandTemplate } from "./TemplateModel";

export interface TemplateStorage {
    listTemplates(organizationId: string): Promise<StandTemplate[]>;
    getTemplate(organizationId: string, templateId: string): Promise<StandTemplate | null>;
    saveTemplate(template: StandTemplate): Promise<StandTemplate>;
    deleteTemplate(organizationId: string, templateId: string): Promise<void>;
}

const INDEX_PREFIX = "configurator:templates:index:";
const ITEM_PREFIX = "configurator:templates:item:";

function indexKey(organizationId: string): string {
    return `${INDEX_PREFIX}${organizationId}`;
}

function itemKey(organizationId: string, templateId: string): string {
    return `${ITEM_PREFIX}${organizationId}:${templateId}`;
}

function readIndex(organizationId: string): string[] {
    const raw = localStorage.getItem(indexKey(organizationId));

    if (!raw) {
        return [];
    }

    try {
        return JSON.parse(raw) as string[];
    } catch {
        return [];
    }
}

function writeIndex(organizationId: string, templateIds: string[]): void {
    localStorage.setItem(indexKey(organizationId), JSON.stringify(templateIds));
}

export class LocalTemplateStorage implements TemplateStorage {
    async listTemplates(organizationId: string): Promise<StandTemplate[]> {
        const templateIds = readIndex(organizationId);
        const templates = await Promise.all(
            templateIds.map(templateId => this.getTemplate(organizationId, templateId))
        );

        return templates
            .filter((template): template is StandTemplate => template !== null)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    async getTemplate(organizationId: string, templateId: string): Promise<StandTemplate | null> {
        const raw = localStorage.getItem(itemKey(organizationId, templateId));

        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as unknown;

            if (!isStandTemplate(parsed) || parsed.organizationId !== organizationId) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    async saveTemplate(template: StandTemplate): Promise<StandTemplate> {
        localStorage.setItem(
            itemKey(template.organizationId, template.id),
            JSON.stringify(template)
        );

        const nextIndex = readIndex(template.organizationId).filter(id => id !== template.id);
        nextIndex.unshift(template.id);
        writeIndex(template.organizationId, nextIndex);

        return template;
    }

    async deleteTemplate(organizationId: string, templateId: string): Promise<void> {
        localStorage.removeItem(itemKey(organizationId, templateId));
        writeIndex(
            organizationId,
            readIndex(organizationId).filter(id => id !== templateId)
        );
    }
}

export const localTemplateStorage = new LocalTemplateStorage();
