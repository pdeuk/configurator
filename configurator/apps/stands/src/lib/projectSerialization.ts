import type {
    ArtworkInfo,
    FabricInfo,
    FabricSide,
    StandModule
} from "../models/ModuleModel";
import {
    createEmptyProjectBomSnapshot,
    createEmptyProjectOwnership,
    createEmptyProjectQuoteRef,
    isProjectDocument,
    isProjectDocumentV1,
    resolveFabricKind,
    type PersistableEditorState,
    type ProjectArtworkAsset,
    type ProjectArtworkAssignment,
    type ProjectDocument,
    type ProjectDocumentV1,
    type ProjectFabricFace,
    type ProjectModule
} from "../models/ProjectModel";
import { PROJECT_MIN_SUPPORTED_SCHEMA_VERSION, PROJECT_SCHEMA_VERSION } from "./schemaVersion";
import { getFabricSidesForModule, getModuleFabric } from "../utils/fabrics";

const DEFAULT_ARTWORK_BUCKET = "project-artwork";

function createArtworkDedupeKey(artwork: ArtworkInfo): string {
    return [
        artwork.fileName,
        artwork.fileType,
        artwork.pixelWidth,
        artwork.pixelHeight,
        artwork.printWidthCm,
        artwork.printHeightCm
    ].join(":");
}

function buildDefaultStoragePath(
    projectId: string,
    assetId: string,
    fileName: string
): string {
    return `${projectId}/assets/${assetId}/${fileName}`;
}

function isTransientArtworkUrl(value: string): boolean {
    return value.startsWith("blob:") || value.startsWith("data:");
}

function sanitizeSourceArtwork(
    sourceArtwork: ArtworkInfo["sourceArtwork"]
): ArtworkInfo["sourceArtwork"] {
    if (!sourceArtwork) {
        return undefined;
    }

    return {
        ...sourceArtwork,
        imageUrl: isTransientArtworkUrl(sourceArtwork.imageUrl)
            ? ""
            : sourceArtwork.imageUrl
    };
}

function toProjectArtworkAsset(
    assetId: string,
    artwork: ArtworkInfo,
    projectId: string,
    timestamp: string
): ProjectArtworkAsset {
    const isRemoteUrl = artwork.imageUrl.startsWith("http://")
        || artwork.imageUrl.startsWith("https://");
    const sourceArtwork = sanitizeSourceArtwork(artwork.sourceArtwork);

    return {
        id: assetId,
        fileName: artwork.fileName,
        fileType: artwork.fileType,
        pixelWidth: artwork.pixelWidth,
        pixelHeight: artwork.pixelHeight,
        printWidthCm: artwork.printWidthCm,
        printHeightCm: artwork.printHeightCm,
        dpiX: artwork.dpiX,
        dpiY: artwork.dpiY,
        effectiveDpi: artwork.effectiveDpi,
        rasters: artwork.rasters,
        ...(sourceArtwork ? { sourceArtwork } : {}),
        storage: {
            bucket: DEFAULT_ARTWORK_BUCKET,
            path: buildDefaultStoragePath(projectId, assetId, artwork.fileName),
            publicUrl: isRemoteUrl ? artwork.imageUrl : null,
            localPreviewUrl: null
        },
        createdAt: timestamp,
        updatedAt: timestamp
    };
}

function toArtworkInfo(asset: ProjectArtworkAsset): ArtworkInfo {
    const previewUrl = asset.storage.publicUrl ?? "";

    return {
        assetId: asset.id,
        fileName: asset.fileName,
        fileType: asset.fileType,
        imageUrl: previewUrl,
        pixelWidth: asset.pixelWidth,
        pixelHeight: asset.pixelHeight,
        printWidthCm: asset.printWidthCm,
        printHeightCm: asset.printHeightCm,
        dpiX: asset.dpiX,
        dpiY: asset.dpiY,
        effectiveDpi: asset.effectiveDpi,
        rasters: asset.rasters,
        ...(asset.sourceArtwork ? { sourceArtwork: asset.sourceArtwork } : {})
    };
}

function collectArtworkFromModules(
    modules: StandModule[],
    projectId: string,
    timestamp: string
): {
    artworkAssets: ProjectArtworkAsset[];
    artworkByRuntimeRef: Map<ArtworkInfo, ProjectArtworkAsset["id"]>;
} {
    const artworkAssets: ProjectArtworkAsset[] = [];
    const artworkByKey = new Map<string, ProjectArtworkAsset["id"]>();
    const artworkByRuntimeRef = new Map<ArtworkInfo, ProjectArtworkAsset["id"]>();

    const registerArtwork = (artwork: ArtworkInfo | null | undefined) => {
        if (!artwork) {
            return null;
        }

        const existingId = artworkByRuntimeRef.get(artwork);

        if (existingId) {
            return existingId;
        }

        if (artwork.assetId) {
            if (!artworkAssets.some(asset => asset.id === artwork.assetId)) {
                artworkAssets.push(
                    toProjectArtworkAsset(artwork.assetId, artwork, projectId, timestamp)
                );
            }

            artworkByKey.set(createArtworkDedupeKey(artwork), artwork.assetId);
            artworkByRuntimeRef.set(artwork, artwork.assetId);

            return artwork.assetId;
        }

        const dedupeKey = createArtworkDedupeKey(artwork);
        const existingByKey = artworkByKey.get(dedupeKey);

        if (existingByKey) {
            artworkByRuntimeRef.set(artwork, existingByKey);
            return existingByKey;
        }

        const assetId = crypto.randomUUID();
        const asset = toProjectArtworkAsset(assetId, artwork, projectId, timestamp);

        artworkAssets.push(asset);
        artworkByKey.set(dedupeKey, assetId);
        artworkByRuntimeRef.set(artwork, assetId);

        return assetId;
    };

    for (const module of modules) {
        registerArtwork(module.artwork);

        for (const side of getFabricSidesForModule(module)) {
            const fabric = getModuleFabric(module, side);
            registerArtwork(fabric.artwork);
        }
    }

    return {
        artworkAssets,
        artworkByRuntimeRef
    };
}

function toProjectFabricFace(
    module: StandModule,
    side: FabricSide,
    artworkByRuntimeRef: Map<ArtworkInfo, ProjectArtworkAsset["id"]>
): ProjectFabricFace {
    const fabric = getModuleFabric(module, side);

    return {
        side,
        fabricKind: resolveFabricKind(fabric),
        isBlockout: fabric.isBlockout,
        isLuminous: fabric.isLuminous,
        artworkAssetId: fabric.artwork
            ? artworkByRuntimeRef.get(fabric.artwork) ?? null
            : null
    };
}

function toProjectModule(
    module: StandModule,
    artworkByRuntimeRef: Map<ArtworkInfo, ProjectArtworkAsset["id"]>
): ProjectModule {
    return {
        id: module.id,
        type: module.type,
        position: { ...module.position },
        rotation: module.rotation,
        dimensions: {
            width: module.width,
            height: module.height,
            depth: module.depth
        },
        ...(module.segmentCount !== undefined ? { segmentCount: module.segmentCount } : {}),
        ...(module.hasMelamineTop !== undefined ? { hasMelamineTop: module.hasMelamineTop } : {}),
        ...(module.wallLayout !== undefined ? { wallLayout: module.wallLayout } : {}),
        snappedTo: module.snappedTo ?? null,
        fabrics: getFabricSidesForModule(module).map(side =>
            toProjectFabricFace(module, side, artworkByRuntimeRef)
        ),
        primaryArtworkAssetId: module.artwork
            ? artworkByRuntimeRef.get(module.artwork) ?? null
            : null
    };
}

function buildArtworkAssignments(modules: ProjectModule[]): ProjectArtworkAssignment[] {
    const assignments: ProjectArtworkAssignment[] = [];

    for (const module of modules) {
        for (const fabric of module.fabrics) {
            if (!fabric.artworkAssetId) {
                continue;
            }

            assignments.push({
                artworkAssetId: fabric.artworkAssetId,
                moduleId: module.id,
                face: fabric.side
            });
        }
    }

    return assignments;
}

function applyFabricToModule(
    fabrics: ProjectModule["fabrics"],
    artworkAssetsById: Map<string, ProjectArtworkAsset>
): StandModule["fabrics"] {
    const nextFabrics: NonNullable<StandModule["fabrics"]> = {};

    for (const fabric of fabrics) {
        const artworkAsset = fabric.artworkAssetId
            ? artworkAssetsById.get(fabric.artworkAssetId)
            : undefined;

        const fabricInfo: FabricInfo = {
            isBlockout: fabric.isBlockout,
            isLuminous: fabric.isLuminous,
            artwork: artworkAsset ? toArtworkInfo(artworkAsset) : null
        };

        nextFabrics[fabric.side] = fabricInfo;
    }

    return nextFabrics;
}

function toStandModule(
    module: ProjectModule,
    artworkAssetsById: Map<string, ProjectArtworkAsset>
): StandModule {
    const primaryArtwork = module.primaryArtworkAssetId
        ? artworkAssetsById.get(module.primaryArtworkAssetId)
        : undefined;

    return {
        id: module.id,
        type: module.type,
        position: { ...module.position },
        rotation: module.rotation,
        width: module.dimensions.width,
        height: module.dimensions.height,
        depth: module.dimensions.depth,
        ...(module.segmentCount !== undefined ? { segmentCount: module.segmentCount } : {}),
        ...(module.hasMelamineTop !== undefined ? { hasMelamineTop: module.hasMelamineTop } : {}),
        ...(module.wallLayout !== undefined ? { wallLayout: module.wallLayout } : {}),
        snappedTo: module.snappedTo ?? null,
        fabrics: applyFabricToModule(module.fabrics, artworkAssetsById) ?? {},
        artwork: primaryArtwork ? toArtworkInfo(primaryArtwork) : null
    };
}

export function migrateProjectDocumentV1(document: ProjectDocumentV1): ProjectDocument {
    return persistableStateToProjectDocument(
        {
            moduleIds: document.modules.map(module => module.id),
            modulesById: Object.fromEntries(document.modules.map(module => [module.id, module])),
            floorMaterialId: document.floor.materialId,
            floorSize: document.floor.size,
            showGrid: document.showGrid
        },
        {
            id: document.id,
            name: document.name,
            createdAt: document.updatedAt,
            updatedAt: document.updatedAt
        }
    );
}

export function normalizeProjectDocument(raw: unknown): ProjectDocument | null {
    if (isProjectDocument(raw)) {
        return raw;
    }

    if (isProjectDocumentV1(raw)) {
        return migrateProjectDocumentV1(raw);
    }

    if (!raw || typeof raw !== "object") {
        return null;
    }

    const candidate = raw as Partial<ProjectDocument> & Partial<ProjectDocumentV1>;

    if (
        typeof candidate.schemaVersion === "number" &&
        candidate.schemaVersion < PROJECT_MIN_SUPPORTED_SCHEMA_VERSION
    ) {
        return null;
    }

    if (Array.isArray(candidate.modules) && candidate.floor && typeof candidate.showGrid === "boolean") {
        const legacyFloor = candidate.floor as ProjectDocumentV1["floor"];

        return migrateProjectDocumentV1({
            schemaVersion: 1,
            id: candidate.id ?? "default",
            name: candidate.name ?? "Untitled stand",
            updatedAt: candidate.updatedAt ?? new Date().toISOString(),
            modules: candidate.modules as StandModule[],
            floor: legacyFloor,
            showGrid: candidate.showGrid
        });
    }

    return null;
}

export function persistableStateToProjectDocument(
    state: PersistableEditorState,
    metadata: Pick<ProjectDocument, "id" | "name"> & Partial<Pick<ProjectDocument, "createdAt" | "updatedAt">>,
    extensions: Partial<Pick<ProjectDocument, "ownership" | "quote" | "bom">> = {}
): ProjectDocument {
    const timestamp = new Date().toISOString();
    const modules = state.moduleIds
        .map(moduleId => state.modulesById[moduleId])
        .filter((module): module is StandModule => module !== undefined);
    const { artworkAssets, artworkByRuntimeRef } = collectArtworkFromModules(
        modules,
        metadata.id,
        metadata.updatedAt ?? timestamp
    );
    const projectModules = modules.map(module =>
        toProjectModule(module, artworkByRuntimeRef)
    );

    return {
        schemaVersion: PROJECT_SCHEMA_VERSION,
        id: metadata.id,
        name: metadata.name,
        createdAt: metadata.createdAt ?? timestamp,
        updatedAt: metadata.updatedAt ?? timestamp,
        ownership: extensions.ownership ?? createEmptyProjectOwnership(),
        quote: extensions.quote ?? createEmptyProjectQuoteRef(),
        bom: extensions.bom ?? createEmptyProjectBomSnapshot(),
        floor: {
            width: state.floorSize.width,
            depth: state.floorSize.depth,
            materialId: state.floorMaterialId,
            showGrid: state.showGrid
        },
        scene: {
            moduleOrder: [...state.moduleIds],
            showGrid: state.showGrid
        },
        modules: projectModules,
        artworkAssets,
        artworkAssignments: buildArtworkAssignments(projectModules)
    };
}

export function projectDocumentToPersistableState(
    document: ProjectDocument
): PersistableEditorState {
    const artworkAssetsById = new Map(
        document.artworkAssets.map(asset => [asset.id, asset])
    );
    const modulesById: Record<StandModule["id"], StandModule> = {};
    const moduleOrder = document.scene.moduleOrder.length > 0
        ? document.scene.moduleOrder
        : document.modules.map(module => module.id);

    for (const projectModule of document.modules) {
        modulesById[projectModule.id] = toStandModule(projectModule, artworkAssetsById);
    }

    const moduleIds = moduleOrder.filter(moduleId => modulesById[moduleId] !== undefined);

    for (const projectModule of document.modules) {
        if (!moduleIds.includes(projectModule.id)) {
            moduleIds.push(projectModule.id);
        }
    }

    return {
        moduleIds,
        modulesById,
        floorMaterialId: document.floor.materialId,
        floorSize: {
            width: document.floor.width,
            depth: document.floor.depth
        },
        showGrid: document.floor.showGrid
    };
}

export function selectPersistableEditorState(
    state: PersistableEditorState
): PersistableEditorState {
    return {
        moduleIds: [...state.moduleIds],
        modulesById: { ...state.modulesById },
        floorMaterialId: state.floorMaterialId,
        floorSize: { ...state.floorSize },
        showGrid: state.showGrid
    };
}
