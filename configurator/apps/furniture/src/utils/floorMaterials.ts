/** Max floor edge length in meters (2000 cm). */
export const MAX_FLOOR_DIMENSION = 20;
export const MIN_FLOOR_SIZE = 0.5;
/** Default floor footprint: 600 cm × 600 cm (stored in meters). */
export const DEFAULT_FLOOR_WIDTH = 6;
export const DEFAULT_FLOOR_DEPTH = 6;
/** Reference size used when scaling repeating floor textures. */
export const FLOOR_TEXTURE_REFERENCE_SIZE = 20;
/** Grid cell size in meters (100 cm). */
export const FLOOR_GRID_CELL_SIZE = 1;

/** @deprecated Use FLOOR_TEXTURE_REFERENCE_SIZE */
export const GRID_SIZE = FLOOR_TEXTURE_REFERENCE_SIZE;
/** @deprecated Use MAX_FLOOR_DIMENSION */
export const DEFAULT_FLOOR_SIZE = DEFAULT_FLOOR_WIDTH;
/** @deprecated Use FLOOR_TEXTURE_REFERENCE_SIZE */
export const FLOOR_SIZE = FLOOR_TEXTURE_REFERENCE_SIZE;

export interface FloorSize {
    width: number;
    depth: number;
}

export const DEFAULT_FLOOR_DIMENSIONS: FloorSize = {
    width: DEFAULT_FLOOR_WIDTH,
    depth: DEFAULT_FLOOR_DEPTH
};

export function clampFloorDimension(value: number): number {
    if (!Number.isFinite(value)) {
        return DEFAULT_FLOOR_WIDTH;
    }

    return Math.min(MAX_FLOOR_DIMENSION, Math.max(MIN_FLOOR_SIZE, value));
}

export function clampFloorSize(size: Partial<FloorSize>): FloorSize {
    return {
        width: clampFloorDimension(size.width ?? DEFAULT_FLOOR_WIDTH),
        depth: clampFloorDimension(size.depth ?? DEFAULT_FLOOR_DEPTH)
    };
}

export type FloorMaterialId =
    | "interiorTiles"
    | "woodFloorWorn"
    | "graniteTile04";

export interface FloorMaterialDefinition {
    id: FloorMaterialId;
    label: string;
    textures: {
        diff: string;
        normal: string;
        arm: string;
    };
    /** Texture repeats across the full floor edge (higher = smaller tiles). */
    tilesAcrossFloor: number;
}

export const FLOOR_MATERIALS: FloorMaterialDefinition[] = [
    {
        id: "interiorTiles",
        label: "Interior tiles",
        textures: {
            diff: "/floors/interiorTiles/diff.jpg",
            normal: "/floors/interiorTiles/normal.jpg",
            arm: "/floors/interiorTiles/arm.jpg"
        },
        tilesAcrossFloor: 20
    },
    {
        id: "woodFloorWorn",
        label: "Worn wood",
        textures: {
            diff: "/floors/woodFloorWorn/diff.jpg",
            normal: "/floors/woodFloorWorn/normal.jpg",
            arm: "/floors/woodFloorWorn/arm.jpg"
        },
        tilesAcrossFloor: 10
    },
    {
        id: "graniteTile04",
        label: "Granite tile",
        textures: {
            diff: "/floors/graniteTile04/diff.jpg",
            normal: "/floors/graniteTile04/normal.jpg",
            arm: "/floors/graniteTile04/arm.jpg"
        },
        tilesAcrossFloor: 24
    }
];

export const DEFAULT_FLOOR_MATERIAL_ID: FloorMaterialId = "woodFloorWorn";

/** Full-strength texture multiply — color vividness comes from toneMapped=false + emissiveMap. */
export const FLOOR_DIFFUSE_TINT = "#ffffff";

export const FLOOR_AO_INTENSITY = 0.18;
/** Even surface glow that follows the floor texture colors. */
export const FLOOR_EMISSIVE_INTENSITY = 0.2;

/** Slight gloss on the floor surface (used with meshStandardMaterial). */
export const FLOOR_ROUGHNESS = 0.93;
export const FLOOR_METALNESS = 0;
export const FLOOR_ENV_MAP_INTENSITY = 0.08;

export function getFloorMaterial(id: FloorMaterialId): FloorMaterialDefinition {
    return FLOOR_MATERIALS.find(material => material.id === id)
        ?? FLOOR_MATERIALS[0]!;
}
