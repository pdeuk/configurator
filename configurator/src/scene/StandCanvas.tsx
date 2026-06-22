import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { DragController } from "./DragController";
import { useEditorStore } from "../store/editorStore";
import { SnapPreview } from "./SnapPreview";
import { Module } from "./Module";
import type { StandModule } from "../models/ModuleModel";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function StandCanvas() {
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const isDragging = useEditorStore(state => state.drag !== null);
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
            onPointerMissed={() => select(null)}
        >
            <color attach="background" args={["#343841"]} />
            <DragController />
            <SnapPreview />

            <ambientLight intensity={0.38} />

            <directionalLight
                position={[5, 8, 5]}
                intensity={0.55}
            />

            <gridHelper args={[20, 20, "#4a5568", "#252b36"]} />

            {modules.map(module => (
                <Module
                    key={module.id}
                    module={module}
                    modules={modules}
                />
            ))}

            <OrbitControls makeDefault enabled={!isDragging} />
        </Canvas>
    );
}
