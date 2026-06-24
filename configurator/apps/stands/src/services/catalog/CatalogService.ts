import type { StandModule } from "../../models/ModuleModel";
import { getSettingsContext } from "../settings/SettingsService";
import type { CatalogItem, CreateCatalogItemOptions } from "./CatalogModel";
import { localCatalogStorage, type CatalogStorage } from "./CatalogStorage";
import {
    buildCatalogItemFromModule,
    insertCatalogItemIntoProject as buildModuleFromCatalogItem
} from "./moduleSnapshot";
import type { InsertCatalogItemOptions } from "./CatalogModel";

function getStorage(): CatalogStorage {
    return localCatalogStorage;
}

function getActiveOrganizationId(): string {
    return getSettingsContext().organizationId;
}

export class CatalogService {
    async listCatalogItems(): Promise<CatalogItem[]> {
        return getStorage().listCatalogItems(getActiveOrganizationId());
    }

    async getCatalogItem(catalogItemId: string): Promise<CatalogItem | null> {
        return getStorage().getCatalogItem(getActiveOrganizationId(), catalogItemId);
    }

    async createCatalogItemFromModule(
        module: StandModule,
        options: CreateCatalogItemOptions = {}
    ): Promise<CatalogItem> {
        const item = buildCatalogItemFromModule(module, getActiveOrganizationId(), {
            ...(options.name !== undefined ? { name: options.name } : {}),
            ...(options.description !== undefined ? { description: options.description } : {}),
            ...(options.categoryId !== undefined ? { categoryId: options.categoryId } : {}),
            ...(options.thumbnail !== undefined ? { thumbnail: options.thumbnail } : {}),
            ...(options.defaultPriceItemId !== undefined
                ? { defaultPriceItemId: options.defaultPriceItemId }
                : {})
        });

        return getStorage().saveCatalogItem(item);
    }

    async deleteCatalogItem(catalogItemId: string): Promise<void> {
        await getStorage().deleteCatalogItem(getActiveOrganizationId(), catalogItemId);
    }

    insertCatalogItemIntoProject(
        catalogItem: CatalogItem,
        options: InsertCatalogItemOptions = {}
    ): StandModule {
        return buildModuleFromCatalogItem(catalogItem, options);
    }
}

export const catalogService = new CatalogService();

export function createCatalogItemFromModule(
    module: StandModule,
    options?: CreateCatalogItemOptions
): Promise<CatalogItem> {
    return catalogService.createCatalogItemFromModule(module, options);
}

export function listCatalogItems(): Promise<CatalogItem[]> {
    return catalogService.listCatalogItems();
}

export function getCatalogItem(catalogItemId: string): Promise<CatalogItem | null> {
    return catalogService.getCatalogItem(catalogItemId);
}

export function deleteCatalogItem(catalogItemId: string): Promise<void> {
    return catalogService.deleteCatalogItem(catalogItemId);
}

export function insertCatalogItemIntoProject(
    catalogItem: CatalogItem,
    options?: InsertCatalogItemOptions
): StandModule {
    return catalogService.insertCatalogItemIntoProject(catalogItem, options);
}
