import { useLayoutEffect, Suspense } from "react";

import { Canvas } from "@react-three/fiber";

import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

import { ClampedOrbitControls } from "./ClampedOrbitControls";

import { DragController } from "./DragController";

import { FaceEditCamera } from "./FaceEditCamera";

import { SnapPreview } from "./SnapPreview";

import { StandSceneContent } from "./StandSceneContent";

import { useEditorStore } from "../store/editorStore";
import { floorOnlyMode } from "../../client.config";



export function StandCanvas() {

    const isDragging = useEditorStore(state => state.drag !== null);

    const artworkEditMode = useEditorStore(state => state.artworkEditMode);

    const readOnly = useEditorStore(state => state.readOnly);
    const sceneReadOnly = readOnly || floorOnlyMode;

    const select = useEditorStore(state => state.select);



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

                if (!sceneReadOnly && !artworkEditMode) {

                    select(null);

                }

            }}

        >

            <color attach="background" args={["#ffffff"]} />

            {!sceneReadOnly && <DragController />}

            {!sceneReadOnly && <SnapPreview />}

            {!sceneReadOnly && <FaceEditCamera />}



            <Suspense fallback={null}>

                <StandSceneContent />

            </Suspense>



            <ClampedOrbitControls

                enabled={sceneReadOnly || (!isDragging && !artworkEditMode)}

            />

        </Canvas>

    );

}

