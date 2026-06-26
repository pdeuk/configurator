import type { ModuleType, StandModule } from "../../models/ModuleModel";
import { COMPONENT_OPTIONS, normalizeWallRotation } from "../../utils/componentCatalog";
import type {
    CatalogDimensions,
    CatalogItem,
    InsertCatalogItemOptions,
    ModuleCatalogSnapshot
} from "./CatalogModel";
import {
    inferCatalogCategoryFromModule,
    inferDefaultPriceItemId
} from "./CatalogModel";

function cloneSnapshot<T>(value: T): T {
    return structuredClone(value);
}

function extractDimensions(module: StandModule): CatalogDimensions {
    return {
        width: module.width,
        height: module.height,
        depth: module.depth
    };
}

export function extractModuleCatalogSnapshot(module: StandModule): ModuleCatalogSnapshot {
    const { id: _id, ...snapshot } = cloneSnapshot(module);
    return snapshot;
}

function inferComponentName(module: StandModule): string {
    const label = COMPONENT_OPTIONS.find(option => option.id === module.type)?.label;

    if (label) {
        return label;
    }

    return `${module.type} component`;
}

function computeInsertPosition(type: ModuleType, moduleCount: number): StandModule["position"] {
    switch (type) {
        case "wall":
        case "exhibitionWall":
            return { x: moduleCount * 1.25, y: 0, z: 0 };
        case "cube":
        case "promoStand":
        case "corner":
            return { x: moduleCount * 0.75, y: 0, z: 0.75 };
        case "circularBanner":
        case "squareBanner":
            return { x: moduleCount * 0.9, y: 0, z: 0.9 };
        default:
            return { x: moduleCount * 0.75, y: 0, z: 0.75 };
    }
}

export function buildCatalogItemFromModule(
    module: StandModule,
    organizationId: string,
    options: {
        name?: string;
        description?: string;
        categoryId?: string;
        thumbnail?: string | null;
        defaultPriceItemId?: CatalogItem["defaultPriceItemId"];
    } = {}
): CatalogItem {
    return {
        id: crypto.randomUUID(),
        organizationId,
        name: options.name?.trim() || inferComponentName(module),
        description: options.description?.trim() ?? "",
        category: options.categoryId ?? inferCatalogCategoryFromModule(module),
        thumbnail: options.thumbnail ?? null,
        moduleSnapshot: extractModuleCatalogSnapshot(module),
        defaultDimensions: extractDimensions(module),
        defaultPriceItemId: options.defaultPriceItemId ?? inferDefaultPriceItemId(module.type),
        createdAt: new Date().toISOString()
    };
}

export function insertCatalogItemIntoProject(
    catalogItem: CatalogItem,
    options: InsertCatalogItemOptions = {}
): StandModule {
    const moduleCount = options.moduleCount ?? 0;
    const snapshot = cloneSnapshot(catalogItem.moduleSnapshot);
    const dimensions = catalogItem.defaultDimensions;

    return {
        ...snapshot,
        id: `${snapshot.type}-${crypto.randomUUID()}`,
        width: dimensions.width,
        height: dimensions.height,
        depth: dimensions.depth,
        position: computeInsertPosition(snapshot.type, moduleCount),
        rotation:
            snapshot.type === "wall" || snapshot.type === "exhibitionWall"
                ? normalizeWallRotation(snapshot.rotation)
                : snapshot.rotation,
        snappedTo: null
    };
}
