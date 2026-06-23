import { useMemo, Suspense, useLayoutEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
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

    useLayoutEffect(() => {
        RectAreaLightUniformsLib.init();
    }, []);

    return (
        <Canvas
            gl={{ toneMappingExposure: 1.3 }}
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
            <color attach="background" args={["#525862"]} />
            <DragController />
            <SnapPreview />
            <FaceEditCamera />

            {/* Exhibition hall — bright neutral fill; cool enough for luminous fabric. */}
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
