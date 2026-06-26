import type {
    ArtworkFileType,
    ArtworkSourceSnapshot,
    FabricSide,
    ModuleType,
    Position3,
    RasterArtworkInfo,
    StandModule
} from "./ModuleModel";
import type { FloorMaterialId } from "../utils/floorMaterials";
import { PROJECT_SCHEMA_VERSION } from "../lib/schemaVersion";

export { PROJECT_SCHEMA_VERSION };

/** Derived fabric finish used for BOM/quotes; maps from blockout/luminous flags. */
export type ProjectFabricKind = "standard" | "blockout" | "luminous";

export interface ProjectDimensions {
    width: number;
    height: number;
    depth: number;
}

export interface ProjectFloorSettings {
    width: number;
    depth: number;
    materialId: FloorMaterialId;
    showGrid: boolean;
}

export interface ProjectSceneSettings {
    /** Module ids in scene placement / undo order. */
    moduleOrder: StandModule["id"][];
    showGrid: boolean;
}

/** Reserved for Supabase auth — optional until accounts are enabled. */
export interface ProjectOwnership {
    userId: string | null;
    organizationId: string | null;
}

/** Reserved for sales workflow — optional until quotes are enabled. */
export interface ProjectQuoteRef {
    quoteId: string | null;
    quoteNumber: string | null;
    status: "draft" | "sent" | "accepted" | "expired" | null;
}

/** Reserved for manufacturing output — optional until BOM export is enabled. */
export interface ProjectBomLine {
    sku: string | null;
    description: string;
    quantity: number;
    unit: string | null;
    moduleId: StandModule["id"] | null;
    face: FabricSide | null;
}

export interface ProjectBomSnapshot {
    generatedAt: string | null;
    revision: number | null;
    lines: ProjectBomLine[];
}

/** Supabase-ready artwork asset record (decoupled from module/face assignment). */
export interface ProjectArtworkStorageRef {
    /** Target bucket, e.g. `project-artwork`. */
    bucket: string;
    /** Object path inside the bucket, e.g. `{projectId}/assets/{assetId}/file.pdf`. */
    path: string;
    /** CDN/public URL once uploaded — null while pending upload. */
    publicUrl: string | null;
    /** Local blob/object URL for in-browser preview — not synced to cloud. */
    localPreviewUrl: string | null;
}

export interface ProjectArtworkAsset {
    id: string;
    fileName: string;
    fileType: ArtworkFileType;
    pixelWidth: number;
    pixelHeight: number;
    printWidthCm: number;
    printHeightCm: number;
    dpiX: number;
    dpiY: number;
    effectiveDpi: number;
    rasters: RasterArtworkInfo[];
    sourceArtwork?: ArtworkSourceSnapshot;
    storage: ProjectArtworkStorageRef;
    createdAt: string;
    updatedAt: string;
}

/** Explicit artwork-to-fabric placement for quotes, BOM, and re-hydration. */
export interface ProjectArtworkAssignment {
    artworkAssetId: ProjectArtworkAsset["id"];
    moduleId: StandModule["id"];
    face: FabricSide;
}

export interface ProjectFabricFace {
    side: FabricSide;
    fabricKind: ProjectFabricKind;
    isBlockout: boolean;
    isLuminous: boolean;
    artworkAssetId: ProjectArtworkAsset["id"] | null;
}

/** Persisted module — explicit shape for cloud storage and BOM generation. */
export interface ProjectModule {
    id: StandModule["id"];
    type: ModuleType;
    position: Position3;
    rotation: number;
    dimensions: ProjectDimensions;
    /** Banner segment count (circular/square hanging banners). */
    segmentCount?: number;
    /** Cube melamine top option. */
    hasMelamineTop?: boolean;
    /** Wall frame layout variant. */
    wallLayout?: StandModule["wallLayout"];
    /** Snap connection target module id. */
    snappedTo?: string | null;
    fabrics: ProjectFabricFace[];
    /** Legacy module-level artwork pointer (typically front face). */
    primaryArtworkAssetId: ProjectArtworkAsset["id"] | null;
}

export interface ProjectMetadata {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    ownership: ProjectOwnership;
    quote: ProjectQuoteRef;
    bom: ProjectBomSnapshot;
}

/** Lightweight project list row; avoids loading the full scene JSON for dashboards. */
export interface ProjectListItem extends ProjectMetadata {
    moduleCount: number | null;
    floorWidth: number | null;
    floorDepth: number | null;
}

/** Serializable project document — excludes transient UI/editor session state. */
export interface ProjectDocument {
    schemaVersion: number;
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
    ownership: ProjectOwnership;
    quote: ProjectQuoteRef;
    bom: ProjectBomSnapshot;
    floor: ProjectFloorSettings;
    scene: ProjectSceneSettings;
    modules: ProjectModule[];
    artworkAssets: ProjectArtworkAsset[];
    artworkAssignments: ProjectArtworkAssignment[];
}

/** Subset of editor store state that maps to a project document. */
export interface PersistableEditorState {
    moduleIds: StandModule["id"][];
    modulesById: Record<StandModule["id"], StandModule>;
    floorMaterialId: FloorMaterialId;
    floorSize: {
        width: number;
        depth: number;
    };
    showGrid: boolean;
}

/** Legacy v1 document shape (modules embedded as runtime StandModule). */
export interface ProjectDocumentV1 {
    schemaVersion: 1;
    id: string;
    name: string;
    updatedAt: string;
    modules: StandModule[];
    floor: {
        materialId: FloorMaterialId;
        size: {
            width: number;
            depth: number;
        };
    };
    showGrid: boolean;
}

export function resolveFabricKind(fabric: {
    isBlockout: boolean;
    isLuminous: boolean;
}): ProjectFabricKind {
    if (fabric.isBlockout) {
        return "blockout";
    }

    if (fabric.isLuminous) {
        return "luminous";
    }

    return "standard";
}

export function createEmptyProjectOwnership(): ProjectOwnership {
    return {
        userId: null,
        organizationId: null
    };
}

export function createEmptyProjectQuoteRef(): ProjectQuoteRef {
    return {
        quoteId: null,
        quoteNumber: null,
        status: null
    };
}

export function createEmptyProjectBomSnapshot(): ProjectBomSnapshot {
    return {
        generatedAt: null,
        revision: null,
        lines: []
    };
}

export function isProjectDocument(value: unknown): value is ProjectDocument {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ProjectDocument>;

    return (
        typeof candidate.schemaVersion === "number" &&
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.createdAt === "string" &&
        typeof candidate.updatedAt === "string" &&
        candidate.ownership !== null &&
        typeof candidate.ownership === "object" &&
        candidate.quote !== null &&
        typeof candidate.quote === "object" &&
        candidate.bom !== null &&
        typeof candidate.bom === "object" &&
        candidate.floor !== null &&
        typeof candidate.floor === "object" &&
        typeof candidate.floor.width === "number" &&
        typeof candidate.floor.depth === "number" &&
        typeof candidate.floor.materialId === "string" &&
        typeof candidate.floor.showGrid === "boolean" &&
        candidate.scene !== null &&
        typeof candidate.scene === "object" &&
        Array.isArray(candidate.scene.moduleOrder) &&
        typeof candidate.scene.showGrid === "boolean" &&
        Array.isArray(candidate.modules) &&
        Array.isArray(candidate.artworkAssets) &&
        Array.isArray(candidate.artworkAssignments)
    );
}

export function isProjectDocumentV1(value: unknown): value is ProjectDocumentV1 {
    if (!value || typeof value !== "object") {
        return false;
    }

    const candidate = value as Partial<ProjectDocumentV1>;

    return (
        candidate.schemaVersion === 1 &&
        typeof candidate.id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.updatedAt === "string" &&
        Array.isArray(candidate.modules) &&
        candidate.floor !== null &&
        typeof candidate.floor === "object" &&
        typeof candidate.showGrid === "boolean"
    );
}
