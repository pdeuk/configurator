import { Suspense, useMemo } from "react";
import { Environment } from "@react-three/drei";
import { Floor } from "./Floor";
import { Module } from "./Module";
import { useEditorStore } from "../store/editorStore";
import type { StandModule } from "../models/ModuleModel";
import { GRID_SIZE } from "../utils/floorMaterials";
import { floorOnlyMode } from "../../client.config";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export interface StandSceneContentProps {
    showGrid?: boolean;
    showFloor?: boolean;
}

export function StandSceneContent({
    showGrid,
    showFloor = true
}: StandSceneContentProps) {
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const floorMaterialId = useEditorStore(state => state.floorMaterialId);
    const floorSize = useEditorStore(state => state.floorSize);
    const storeShowGrid = useEditorStore(state => state.showGrid);

    const modules = useMemo(
        () => moduleIds.map(id => modulesById[id]).filter(isStandModule),
        [moduleIds, modulesById]
    );

    const renderGrid = showGrid ?? storeShowGrid;

    return (
        <>
            <ambientLight intensity={0.5} color="#eef2f7" />

            <hemisphereLight
                color="#eef2f7"
                groundColor="#7a8494"
                intensity={0.55}
            />

            <directionalLight
                position={[5, 10, 5]}
                intensity={0.82}
                color="#f5f8fc"
            />

            <directionalLight
                position={[-4, 6, -3]}
                intensity={0.34}
                color="#e8f0f8"
            />

            <directionalLight
                position={[0, 14, 2]}
                intensity={0.4}
                color="#f8fafc"
            />

            <Environment
                preset="studio"
                background={false}
                environmentIntensity={0.48}
            />

            {renderGrid && (
                <gridHelper args={[GRID_SIZE, GRID_SIZE, "#4a5568", "#252b36"]} />
            )}

            {showFloor && (
                <Suspense fallback={null}>
                    <Floor
                        key={floorMaterialId}
                        materialId={floorMaterialId}
                        width={floorSize.width}
                        depth={floorSize.depth}
                    />
                </Suspense>
            )}

            {!floorOnlyMode && modules.map(module => (
                <Module
                    key={module.id}
                    module={module}
                    modules={modules}
                />
            ))}
        </>
    );
}
