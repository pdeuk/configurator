import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Quaternion, Vector3 } from "three";
import type { StandModule } from "../models/ModuleModel";
import { useEditorStore } from "../store/editorStore";
import { getFrameConnectionLayout } from "./frameConnections";
import {
    getFabricFaceLayout,
    getFabricFaceWorldFrame,
    type FabricFaceWorldFrame
} from "../utils/fabricFaceGeometry";

interface SavedCameraState {
    position: Vector3;
    quaternion: Quaternion;
    fov: number;
    up: Vector3;
}

function fitPerspectiveCameraToFace(
    camera: PerspectiveCamera,
    frame: FabricFaceWorldFrame,
    viewportWidth: number,
    viewportHeight: number
) {
    const padding = 1.06;
    const viewAspect = viewportWidth / viewportHeight;
    const faceAspect = frame.width / frame.height;
    const distance = Math.max(frame.width, frame.height) * 1.75;

    camera.position.copy(frame.center).add(
        frame.normal.clone().multiplyScalar(distance)
    );
    camera.up.copy(frame.up);
    camera.lookAt(frame.center);

    const verticalFovRadians = 2 * Math.atan(
        (frame.height * padding) / (2 * distance)
    );
    let verticalFovDegrees = (verticalFovRadians * 180) / Math.PI;

    if (viewAspect > faceAspect) {
        const horizontalFovRadians = 2 * Math.atan(
            (frame.width * padding) / (2 * distance)
        );
        const horizontalFovDegrees = (horizontalFovRadians * 180) / Math.PI;
        const adjustedVertical = (horizontalFovDegrees / viewAspect);

        verticalFovDegrees = Math.max(verticalFovDegrees, adjustedVertical);
    }

    camera.fov = verticalFovDegrees;
    camera.aspect = viewAspect;
    camera.near = 0.05;
    camera.far = Math.max(distance * 4, 50);
    camera.updateProjectionMatrix();
}

export function FaceEditCamera() {
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const savedCameraRef = useRef<SavedCameraState | null>(null);
    const { camera, size } = useThree();

    const modules = useMemo(
        () => moduleIds
            .map(id => modulesById[id])
            .filter((module): module is StandModule => module !== undefined),
        [moduleIds, modulesById]
    );

    const editTarget = useMemo(() => {
        if (!artworkEditMode) {
            return null;
        }

        const module = modulesById[artworkEditMode.moduleId];

        if (!module) {
            return null;
        }

        const connectionLayout = getFrameConnectionLayout(module, modules);
        const layout = getFabricFaceLayout(
            module,
            artworkEditMode.side,
            connectionLayout
        );

        if (!layout) {
            return null;
        }

        return {
            module,
            layout,
            frame: getFabricFaceWorldFrame(module, layout)
        };
    }, [artworkEditMode, modules, modulesById]);

    useEffect(() => {
        if (!(camera instanceof PerspectiveCamera)) {
            return;
        }

        if (!editTarget) {
            const saved = savedCameraRef.current;

            if (saved) {
                camera.position.copy(saved.position);
                camera.quaternion.copy(saved.quaternion);
                camera.up.copy(saved.up);
                camera.fov = saved.fov;
                camera.updateProjectionMatrix();
                savedCameraRef.current = null;
            }

            return;
        }

        if (!savedCameraRef.current) {
            savedCameraRef.current = {
                position: camera.position.clone(),
                quaternion: camera.quaternion.clone(),
                fov: camera.fov,
                up: camera.up.clone()
            };
        }

        fitPerspectiveCameraToFace(
            camera,
            editTarget.frame,
            size.width,
            size.height
        );
    }, [camera, editTarget, size.height, size.width]);

    useFrame(() => {
        if (!editTarget || !(camera instanceof PerspectiveCamera)) {
            return;
        }

        fitPerspectiveCameraToFace(
            camera,
            editTarget.frame,
            size.width,
            size.height
        );
    });

    return null;
}
