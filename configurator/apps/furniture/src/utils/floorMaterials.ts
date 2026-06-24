export const GRID_SIZE = 20;
export const MIN_FLOOR_SIZE = 0.5;
export const DEFAULT_FLOOR_SIZE = GRID_SIZE;
/** Default floor footprint: 1200 cm × 1200 cm (stored in meters). */
export const DEFAULT_FLOOR_WIDTH = 12;
export const DEFAULT_FLOOR_DEPTH = 12;

/** @deprecated Use GRID_SIZE */
export const FLOOR_SIZE = GRID_SIZE;

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
        return DEFAULT_FLOOR_SIZE;
    }

    return Math.min(GRID_SIZE, Math.max(MIN_FLOOR_SIZE, value));
}

export function clampFloorSize(size: Partial<FloorSize>): FloorSize {
    return {
        width: clampFloorDimension(size.width ?? DEFAULT_FLOOR_SIZE),
        depth: clampFloorDimension(size.depth ?? DEFAULT_FLOOR_SIZE)
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

export function getFloorMaterial(id: FloorMaterialId): FloorMaterialDefinition {
    return FLOOR_MATERIALS.find(material => material.id === id)
        ?? FLOOR_MATERIALS[0]!;
}
