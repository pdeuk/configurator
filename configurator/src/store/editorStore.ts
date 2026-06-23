import { create } from "zustand";
import type {
    ArtworkInfo,
    FabricSide,
    ModuleFabrics,
    Position3,
    StandModule
} from "../models/ModuleModel";
import type { ProjectDocument } from "../models/ProjectModel";
import { isHangingBannerType } from "../models/ModuleModel";
import { projectDocumentToPersistableState } from "../services/ProjectService";
import { getInitialPersistableState } from "../lib/projectPersistence";
import {
    createDefaultFabrics,
    getFabricSidesForModule,
    getModuleFabric,
    recalculateModuleFabrics,
    resizeModuleFabricsForSegmentCount,
    setModuleFabric
} from "../utils/fabrics";
import { clampBannerSegmentCount } from "../utils/bannerFabrics";
import { DEFAULT_BANNER_SEGMENT_COUNT } from "../utils/bannerGeometry";
import { sanitizeActiveFabricSides } from "../utils/applyFabricArtwork";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import {
    clampFloorSize,
    type FloorMaterialId,
    type FloorSize
} from "../utils/floorMaterials";

const defaultPersistableState = getInitialPersistableState();

export type ModuleId = StandModule["id"];

export interface DragState {
    id: ModuleId;
    offset: Position3;
}

interface EditorSnapshot {
    moduleIds: ModuleId[];
    modulesById: Record<ModuleId, StandModule>;
    selectedId: ModuleId | null;
}

export interface ArtworkEditMode {
    moduleId: ModuleId;
    side: FabricSide;
}

interface EditorState {
    moduleIds: ModuleId[];
    modulesById: Record<ModuleId, StandModule>;
    selectedId: ModuleId | null;
    activeFabricSides: FabricSide[];
    drag: DragState | null;
    snapPosition: Position3 | null;
    artworkEditMode: ArtworkEditMode | null;
    floorMaterialId: FloorMaterialId;
    floorSize: FloorSize;
    showGrid: boolean;
    readOnly: boolean;
    history: EditorSnapshot[];
    select: (id: ModuleId | null) => void;
    addModule: (module: StandModule) => void;
    duplicateModule: (id: ModuleId) => void;
    removeModule: (id: ModuleId) => void;
    undo: () => void;
    toggleFabricSideSelection: (side: FabricSide, additive: boolean) => void;
    beginDrag: (id: ModuleId, offset: Position3) => void;
    endDrag: () => void;
    updateModule: (id: ModuleId, data: Partial<StandModule>) => void;
    updateModulePosition: (id: ModuleId, position: Position3) => void;
    setModuleArtworkForSides: (
        id: ModuleId,
        assignments: Array<{ side: FabricSide; artwork: ArtworkInfo }>
    ) => void;
    setConnectedFabricArtwork: (
        id: ModuleId,
        side: FabricSide,
        artwork: ArtworkInfo
    ) => void;
    setModuleFabricBlockoutForSides: (
        id: ModuleId,
        sides: FabricSide[],
        isBlockout: boolean
    ) => void;
    setModuleFabricLuminousForSides: (
        id: ModuleId,
        sides: FabricSide[],
        isLuminous: boolean
    ) => void;
    setSnapPosition: (position: Position3 | null) => void;
    openArtworkEdit: (moduleId: ModuleId, side: FabricSide) => void;
    closeArtworkEdit: () => void;
    setFloorMaterialId: (materialId: FloorMaterialId) => void;
    setFloorSize: (size: Partial<FloorSize>) => void;
    setShowGrid: (showGrid: boolean) => void;
    setReadOnly: (readOnly: boolean) => void;
    loadProjectDocument: (document: ProjectDocument) => void;
}


function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

function createSnapshot(state: EditorState): EditorSnapshot {
    return {
        moduleIds: [...state.moduleIds],
        modulesById: { ...state.modulesById },
        selectedId: state.selectedId
    };
}

function applyFabricUpdates(
    module: StandModule,
    updates: Array<{ side: FabricSide; fabric: ReturnType<typeof getModuleFabric> }>
): ModuleFabrics {
    const nextModule = updates.reduce((moduleState, update) => ({
        ...moduleState,
        fabrics: setModuleFabric(moduleState, update.side, update.fabric)
    }), module);

    return nextModule.fabrics ?? createDefaultFabrics(
        module.type,
        module.segmentCount ?? DEFAULT_BANNER_SEGMENT_COUNT
    );
}

export const useEditorStore = create<EditorState>((set) => ({
    moduleIds: defaultPersistableState.moduleIds,
    modulesById: defaultPersistableState.modulesById,
    selectedId: null,
    activeFabricSides: ["front"],
    drag: null,
    snapPosition: null,
    artworkEditMode: null,
    floorMaterialId: defaultPersistableState.floorMaterialId,
    floorSize: defaultPersistableState.floorSize,
    showGrid: defaultPersistableState.showGrid,
    readOnly: false,
    history: [],

    select: id =>
        set(state => {
            const module = id ? state.modulesById[id] : undefined;
            const validSides = module ? getFabricSidesForModule(module) : ["front" as const];

            return {
                selectedId: id,
                activeFabricSides: sanitizeActiveFabricSides(
                    state.activeFabricSides,
                    validSides
                )
            };
        }),

    addModule: module =>
        set(state => ({
            history: [...state.history, createSnapshot(state)],
            moduleIds: [...state.moduleIds, module.id],
            modulesById: {
                ...state.modulesById,
                [module.id]: module
            }
        })),

    duplicateModule: id =>
        set(state => {
            const source = state.modulesById[id];

            if (!source) {
                return state;
            }

            const duplicate: StandModule = {
                ...source,
                id: `${source.type}-${crypto.randomUUID()}`,
                position: {
                    ...source.position,
                    x: source.position.x + 0.35,
                    z: source.position.z + 0.35
                },
                fabrics: {
                    ...createDefaultFabrics(
                        source.type,
                        source.segmentCount ?? DEFAULT_BANNER_SEGMENT_COUNT
                    ),
                    ...source.fabrics
                },
                snappedTo: null
            };

            return {
                history: [...state.history, createSnapshot(state)],
                moduleIds: [...state.moduleIds, duplicate.id],
                modulesById: {
                    ...state.modulesById,
                    [duplicate.id]: duplicate
                },
                selectedId: duplicate.id
            };
        }),

    removeModule: id =>
        set(state => {
            if (!state.modulesById[id]) {
                return state;
            }

            const modulesById = { ...state.modulesById };
            delete modulesById[id];

            return {
                history: [...state.history, createSnapshot(state)],
                moduleIds: state.moduleIds.filter(moduleId => moduleId !== id),
                modulesById,
                selectedId: state.selectedId === id ? null : state.selectedId,
                drag: state.drag?.id === id ? null : state.drag,
                snapPosition: state.drag?.id === id ? null : state.snapPosition
            };
        }),

    undo: () =>
        set(state => {
            const snapshot = state.history.at(-1);

            if (!snapshot) {
                return state;
            }

            return {
                moduleIds: snapshot.moduleIds,
                modulesById: snapshot.modulesById,
                selectedId: snapshot.selectedId,
                activeFabricSides: state.activeFabricSides,
                drag: null,
                snapPosition: null,
                history: state.history.slice(0, -1)
            };
        }),

    toggleFabricSideSelection: (side, additive) =>
        set(state => {
            const module = state.selectedId
                ? state.modulesById[state.selectedId]
                : undefined;
            const validSides = module ? getFabricSidesForModule(module) : [];

            if (!validSides.includes(side)) {
                return state;
            }

            if (additive) {
                const isSelected = state.activeFabricSides.includes(side);
                const nextSelection = isSelected
                    ? state.activeFabricSides.filter(selectedSide => selectedSide !== side)
                    : [...state.activeFabricSides, side];

                return {
                    activeFabricSides: nextSelection.length > 0
                        ? nextSelection
                        : [side]
                };
            }

            return {
                activeFabricSides: [side]
            };
        }),

    beginDrag: (id, offset) =>
        set(state => {
            if (state.drag?.id === id) {
                return {
                    drag: {
                        id,
                        offset
                    }
                };
            }

            return {
                history: [...state.history, createSnapshot(state)],
                drag: {
                    id,
                    offset
                }
            };
        }),

    endDrag: () => set({ drag: null }),

    updateModule: (id, data) =>
        set(state => {
            const current = state.modulesById[id];

            if (!current) {
                return state;
            }

            const updatedModule: StandModule = {
                ...current,
                ...data
            };
            const segmentCountChanged =
                isHangingBannerType(updatedModule.type) &&
                data.segmentCount !== undefined &&
                clampBannerSegmentCount(data.segmentCount) !==
                    clampBannerSegmentCount(
                        current.segmentCount ?? DEFAULT_BANNER_SEGMENT_COUNT
                    );
            const moduleWithFabrics = segmentCountChanged
                ? {
                    ...updatedModule,
                    segmentCount: clampBannerSegmentCount(
                        updatedModule.segmentCount ?? DEFAULT_BANNER_SEGMENT_COUNT
                    ),
                    fabrics: resizeModuleFabricsForSegmentCount(
                        current,
                        clampBannerSegmentCount(
                            updatedModule.segmentCount ?? DEFAULT_BANNER_SEGMENT_COUNT
                        )
                    )
                }
                : updatedModule;
            const dimensionsChanged =
                (data.width !== undefined && data.width !== current.width) ||
                (data.height !== undefined && data.height !== current.height) ||
                (data.depth !== undefined && data.depth !== current.depth) ||
                segmentCountChanged;
            const modules = state.moduleIds
                .map(moduleId => state.modulesById[moduleId])
                .filter(isStandModule)
                .map(module => module.id === id ? moduleWithFabrics : module);
            const layout = getFrameConnectionLayout(moduleWithFabrics, modules);
            const nextModule = dimensionsChanged
                ? {
                    ...moduleWithFabrics,
                    fabrics: recalculateModuleFabrics(
                        moduleWithFabrics,
                        modules,
                        layout.fabric.width
                    )
                }
                : moduleWithFabrics;
            const validSides = getFabricSidesForModule(nextModule);
            const activeFabricSides = sanitizeActiveFabricSides(
                state.activeFabricSides,
                validSides
            );

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: {
                    ...state.modulesById,
                    [id]: nextModule
                },
                activeFabricSides
            };
        }),

    updateModulePosition: (id, position) =>
        set(state => {
            const current = state.modulesById[id];

            if (!current) {
                return state;
            }

            if (
                current.position.x === position.x &&
                current.position.y === position.y &&
                current.position.z === position.z
            ) {
                return state;
            }

            return {
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...current,
                        position
                    }
                }
            };
        }),

    setModuleArtworkForSides: (id, assignments) =>
        set(state => {
            const current = state.modulesById[id];

            if (!current || assignments.length === 0) {
                return state;
            }

            const fabrics = applyFabricUpdates(
                current,
                assignments.map(({ side, artwork }) => ({
                    side,
                    fabric: {
                        ...getModuleFabric(current, side),
                        artwork
                    }
                }))
            );

            const primaryArtwork = assignments[0]!.artwork;
            const nextModule: StandModule = {
                ...current,
                fabrics,
                artwork: primaryArtwork
            };

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: {
                    ...state.modulesById,
                    [id]: nextModule
                }
            };
        }),

    setConnectedFabricArtwork: (id, side, artwork) =>
        set(state => {
            const anchor = state.modulesById[id];

            if (!anchor) {
                return state;
            }

            const modules = state.moduleIds
                .map(moduleId => state.modulesById[moduleId])
                .filter((module): module is StandModule => !!module);
            const connectionLayout = getFrameConnectionLayout(anchor, modules);
            const nextModulesById = { ...state.modulesById };

            for (const member of connectionLayout.fabric.members) {
                const current = nextModulesById[member.id];

                if (!current) {
                    continue;
                }

                const fabrics = applyFabricUpdates(current, [{
                    side,
                    fabric: {
                        ...getModuleFabric(current, side),
                        artwork
                    }
                }]);
                const nextModule: StandModule = {
                    ...current,
                    fabrics,
                    ...(member.id === id ? { artwork } : {})
                };

                nextModulesById[member.id] = nextModule;
            }

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: nextModulesById
            };
        }),

    setModuleFabricBlockoutForSides: (id, sides, isBlockout) =>
        set(state => {
            const current = state.modulesById[id];

            if (!current || sides.length === 0) {
                return state;
            }

            const updates = sides
                .map(side => {
                    const fabric = getModuleFabric(current, side);

                    if (fabric.isBlockout === isBlockout) {
                        return null;
                    }

                    return {
                        side,
                        fabric: {
                            ...fabric,
                            isBlockout,
                            isLuminous: isBlockout ? false : fabric.isLuminous
                        }
                    };
                })
                .filter((update): update is NonNullable<typeof update> => update !== null);

            if (updates.length === 0) {
                return state;
            }

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...current,
                        fabrics: applyFabricUpdates(current, updates)
                    }
                }
            };
        }),

    setModuleFabricLuminousForSides: (id, sides, isLuminous) =>
        set(state => {
            const current = state.modulesById[id];

            if (!current || sides.length === 0) {
                return state;
            }

            const updates = sides
                .map(side => {
                    const fabric = getModuleFabric(current, side);

                    if (fabric.isBlockout || fabric.isLuminous === isLuminous) {
                        return null;
                    }

                    return {
                        side,
                        fabric: {
                            ...fabric,
                            isLuminous
                        }
                    };
                })
                .filter((update): update is NonNullable<typeof update> => update !== null);

            if (updates.length === 0) {
                return state;
            }

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...current,
                        fabrics: applyFabricUpdates(current, updates)
                    }
                }
            };
        }),

    setSnapPosition: position =>
        set(state => {
            const current = state.snapPosition;

            if (
                current?.x === position?.x &&
                current?.y === position?.y &&
                current?.z === position?.z
            ) {
                return state;
            }

            return { snapPosition: position };
        }),

    openArtworkEdit: (moduleId, side) =>
        set({
            artworkEditMode: {
                moduleId,
                side
            },
            activeFabricSides: [side]
        }),

    closeArtworkEdit: () =>
        set({
            artworkEditMode: null
        }),

    setFloorMaterialId: materialId =>
        set({
            floorMaterialId: materialId
        }),

    setFloorSize: size =>
        set(state => ({
            floorSize: clampFloorSize({
                ...state.floorSize,
                ...size
            })
        })),

    setShowGrid: showGrid =>
        set({
            showGrid
        }),

    setReadOnly: readOnly =>
        set({
            readOnly,
            ...(readOnly
                ? {
                    selectedId: null,
                    drag: null,
                    snapPosition: null,
                    artworkEditMode: null
                }
                : {})
        }),

    loadProjectDocument: document =>
        set(() => {
            const persistableState = projectDocumentToPersistableState(document);

            return {
                moduleIds: persistableState.moduleIds,
                modulesById: persistableState.modulesById,
                floorMaterialId: persistableState.floorMaterialId,
                floorSize: persistableState.floorSize,
                showGrid: persistableState.showGrid,
                selectedId: null,
                activeFabricSides: ["front"],
                drag: null,
                snapPosition: null,
                artworkEditMode: null,
                history: []
            };
        })
}));
