import { useMemo, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { ClampedOrbitControls } from "./ClampedOrbitControls";
import { DragController } from "./DragController";
import { FaceEditCamera } from "./FaceEditCamera";
import { Floor } from "./Floor";
import { useEditorStore } from "../store/editorStore";
import { SnapPreview } from "./SnapPreview";
import { Module } from "./Module";
import type { StandModule } from "../models/ModuleModel";
import { GRID_SIZE } from "../utils/floorMaterials";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function StandCanvas() {
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const isDragging = useEditorStore(state => state.drag !== null);
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const floorMaterialId = useEditorStore(state => state.floorMaterialId);
    const floorSize = useEditorStore(state => state.floorSize);
    const showGrid = useEditorStore(state => state.showGrid);
    const select = useEditorStore(state => state.select);

    const modules = useMemo(
        () => moduleIds.map(id => modulesById[id]).filter(isStandModule),
        [moduleIds, modulesById]
    );

    return (
        <Canvas
            camera={{
                position: [5, 4, 5],
                fov: 45
            }}
            onPointerMissed={() => {
                if (!artworkEditMode) {
                    select(null);
                }
            }}
        >
            <color attach="background" args={["#343841"]} />
            <DragController />
            <SnapPreview />
            <FaceEditCamera />

            <ambientLight intensity={0.44} />

            <hemisphereLight
                color="#eef3f8"
                groundColor="#6f5f4f"
                intensity={0.48}
            />

            <directionalLight
                position={[5, 10, 5]}
                intensity={0.65}
                color="#fffaf2"
            />

            <directionalLight
                position={[-4, 6, -3]}
                intensity={0.18}
                color="#e8f0ff"
            />

            <Environment
                preset="apartment"
                background={false}
                environmentIntensity={0.48}
            />

            {showGrid && (
                <gridHelper args={[GRID_SIZE, GRID_SIZE, "#4a5568", "#252b36"]} />
            )}

            <Suspense fallback={null}>
                <Floor
                    key={floorMaterialId}
                    materialId={floorMaterialId}
                    width={floorSize.width}
                    depth={floorSize.depth}
                />
            </Suspense>

            {modules.map(module => (
                <Module
                    key={module.id}
                    module={module}
                    modules={modules}
                />
            ))}

            <ClampedOrbitControls enabled={!isDragging && !artworkEditMode} />
        </Canvas>
    );
}
