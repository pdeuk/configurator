import type { CatalogItem } from "./CatalogModel";
import { isCatalogItem } from "./CatalogModel";

export interface CatalogStorage {
    listCatalogItems(organizationId: string): Promise<CatalogItem[]>;
    getCatalogItem(organizationId: string, catalogItemId: string): Promise<CatalogItem | null>;
    saveCatalogItem(item: CatalogItem): Promise<CatalogItem>;
    deleteCatalogItem(organizationId: string, catalogItemId: string): Promise<void>;
}

const INDEX_PREFIX = "configurator:catalog:index:";
const ITEM_PREFIX = "configurator:catalog:item:";

function indexKey(organizationId: string): string {
    return `${INDEX_PREFIX}${organizationId}`;
}

function itemKey(organizationId: string, catalogItemId: string): string {
    return `${ITEM_PREFIX}${organizationId}:${catalogItemId}`;
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

function writeIndex(organizationId: string, catalogItemIds: string[]): void {
    localStorage.setItem(indexKey(organizationId), JSON.stringify(catalogItemIds));
}

export class LocalCatalogStorage implements CatalogStorage {
    async listCatalogItems(organizationId: string): Promise<CatalogItem[]> {
        const catalogItemIds = readIndex(organizationId);
        const items = await Promise.all(
            catalogItemIds.map(catalogItemId => this.getCatalogItem(organizationId, catalogItemId))
        );

        return items
            .filter((item): item is CatalogItem => item !== null)
            .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    async getCatalogItem(
        organizationId: string,
        catalogItemId: string
    ): Promise<CatalogItem | null> {
        const raw = localStorage.getItem(itemKey(organizationId, catalogItemId));

        if (!raw) {
            return null;
        }

        try {
            const parsed = JSON.parse(raw) as unknown;

            if (!isCatalogItem(parsed) || parsed.organizationId !== organizationId) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }

    async saveCatalogItem(item: CatalogItem): Promise<CatalogItem> {
        localStorage.setItem(
            itemKey(item.organizationId, item.id),
            JSON.stringify(item)
        );

        const nextIndex = readIndex(item.organizationId).filter(id => id !== item.id);
        nextIndex.unshift(item.id);
        writeIndex(item.organizationId, nextIndex);

        return item;
    }

    async deleteCatalogItem(organizationId: string, catalogItemId: string): Promise<void> {
        localStorage.removeItem(itemKey(organizationId, catalogItemId));
        writeIndex(
            organizationId,
            readIndex(organizationId).filter(id => id !== catalogItemId)
        );
    }
}

export const localCatalogStorage = new LocalCatalogStorage();
