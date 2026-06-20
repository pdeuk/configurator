import { create } from "zustand";
import type {
    ArtworkInfo,
    FabricSide,
    Position3,
    StandModule
} from "../models/ModuleModel";
import {
    createDefaultFabrics,
    getModuleFabric,
    setModuleFabric
} from "../utils/fabrics";

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

interface EditorState {
    moduleIds: ModuleId[];
    modulesById: Record<ModuleId, StandModule>;
    selectedId: ModuleId | null;
    activeFabricSide: FabricSide;
    drag: DragState | null;
    snapPosition: Position3 | null;
    history: EditorSnapshot[];
    select: (id: ModuleId | null) => void;
    addModule: (module: StandModule) => void;
    duplicateModule: (id: ModuleId) => void;
    removeModule: (id: ModuleId) => void;
    undo: () => void;
    setActiveFabricSide: (side: FabricSide) => void;
    beginDrag: (id: ModuleId, offset: Position3) => void;
    endDrag: () => void;
    updateModule: (id: ModuleId, data: Partial<StandModule>) => void;
    updateModulePosition: (id: ModuleId, position: Position3) => void;
    setModuleArtwork: (id: ModuleId, side: FabricSide, artwork: ArtworkInfo) => void;
    setModuleFabricBlockout: (id: ModuleId, side: FabricSide, isBlockout: boolean) => void;
    setSnapPosition: (position: Position3 | null) => void;
}

const initialWall: StandModule = {
    id: "wall-001",
    type: "wall",
    position: {
        x: 0,
        y: 0,
        z: 0
    },
    rotation: 0,
    width: 1,
    height: 2,
    depth: 0.05,
    fabrics: createDefaultFabrics()
};

function createSnapshot(state: EditorState): EditorSnapshot {
    return {
        moduleIds: [...state.moduleIds],
        modulesById: { ...state.modulesById },
        selectedId: state.selectedId
    };
}

export const useEditorStore = create<EditorState>((set) => ({
    moduleIds: [initialWall.id],
    modulesById: {
        [initialWall.id]: initialWall
    },
    selectedId: null,
    activeFabricSide: "front",
    drag: null,
    snapPosition: null,
    history: [],

    select: id => set({ selectedId: id }),

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
                id: `wall-${crypto.randomUUID()}`,
                position: {
                    ...source.position,
                    x: source.position.x + 0.35,
                    z: source.position.z + 0.35
                },
                fabrics: {
                    ...createDefaultFabrics(),
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
                activeFabricSide: state.activeFabricSide,
                drag: null,
                snapPosition: null,
                history: state.history.slice(0, -1)
            };
        }),

    setActiveFabricSide: side => set({ activeFabricSide: side }),

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

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...current,
                        ...data
                    }
                }
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

    setModuleArtwork: (id, side, artwork) =>
        set(state => {
            const current = state.modulesById[id];

            if (!current) {
                return state;
            }

            const fabric = getModuleFabric(current, side);

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...current,
                        fabrics: setModuleFabric(current, side, {
                            ...fabric,
                            artwork
                        }),
                        artwork
                    }
                }
            };
        }),

    setModuleFabricBlockout: (id, side, isBlockout) =>
        set(state => {
            const current = state.modulesById[id];

            if (!current) {
                return state;
            }

            const fabric = getModuleFabric(current, side);

            if (fabric.isBlockout === isBlockout) {
                return state;
            }

            return {
                history: [...state.history, createSnapshot(state)],
                modulesById: {
                    ...state.modulesById,
                    [id]: {
                        ...current,
                        fabrics: setModuleFabric(current, side, {
                            ...fabric,
                            isBlockout
                        })
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
        })
}));
