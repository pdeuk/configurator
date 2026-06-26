import { useLayoutEffect, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { ClampedOrbitControls } from "./ClampedOrbitControls";
import { DragController } from "./DragController";
import { FaceEditCamera } from "./FaceEditCamera";
import { FrameSquarePreviewBridge } from "./FrameSquarePreview";
import { SceneCaptureBridge } from "./SceneCaptureBridge";
import { SnapPreview } from "./SnapPreview";
import { StandSceneContent } from "./StandSceneContent";
import { useEditorStore } from "../store/editorStore";
import { FrameSquarePlacementControls } from "../ui/FrameSquarePlacementControls";

export function StandCanvas() {
    const isDragging = useEditorStore(state => state.drag !== null);
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const frameSquarePlacement = useEditorStore(state => state.frameSquarePlacement);
    const readOnly = useEditorStore(state => state.readOnly);
    const select = useEditorStore(state => state.select);

    useLayoutEffect(() => {
        RectAreaLightUniformsLib.init();
    }, []);

    return (
        <div style={{ width: "100%", height: "100%", position: "relative" }}>
            <Canvas
                gl={{ toneMappingExposure: 1.3 }}
                camera={{
                    position: [5, 4, 5],
                    fov: 45
                }}
                onPointerMissed={() => {
                    if (!readOnly && !artworkEditMode && !frameSquarePlacement) {
                        select(null);
                    }
                }}
            >
                <color attach="background" args={["#525862"]} />
                {!readOnly && !frameSquarePlacement && <DragController />}
                {!readOnly && <SnapPreview />}
                {!readOnly && <FaceEditCamera />}
                {!readOnly && <FrameSquarePreviewBridge />}

                <Suspense fallback={null}>
                    <StandSceneContent />
                </Suspense>

                <ClampedOrbitControls
                    enabled={readOnly || (!isDragging && !artworkEditMode)}
                />
                <SceneCaptureBridge />
            </Canvas>
            <FrameSquarePlacementControls />
        </div>
    );
}
