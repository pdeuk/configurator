import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";
import { useEditorStore } from "../store/editorStore";
import type { StandModule } from "../models/ModuleModel";
import {
    registerSceneCapture,
    type StandScenePreviewViews
} from "./sceneCaptureRegistry";

const FRONT_WIDTH = 900;
const TOP_MAX_DIMENSION = 720;
/** Small breathing room so geometry never touches the very edge. */
const FRAME_PADDING = 1.015;
const BACKGROUND_COLOR = "#525862";

function waitForNextFrames(count = 2): Promise<void> {
    return new Promise(resolve => {
        let remaining = count;

        const step = () => {
            remaining -= 1;

            if (remaining <= 0) {
                resolve();
                return;
            }

            requestAnimationFrame(step);
        };

        requestAnimationFrame(step);
    });
}

function getRotatedModuleFootprint(module: StandModule) {
    const halfWidth = module.width / 2;
    const halfDepth = module.depth / 2;
    const cos = Math.cos(module.rotation);
    const sin = Math.sin(module.rotation);
    const corners = [
        { x: -halfWidth, z: -halfDepth },
        { x: halfWidth, z: -halfDepth },
        { x: halfWidth, z: halfDepth },
        { x: -halfWidth, z: halfDepth }
    ].map(corner => ({
        x: module.position.x + corner.x * cos - corner.z * sin,
        z: module.position.z + corner.x * sin + corner.z * cos
    }));

    return {
        minX: Math.min(...corners.map(corner => corner.x)),
        maxX: Math.max(...corners.map(corner => corner.x)),
        minZ: Math.min(...corners.map(corner => corner.z)),
        maxZ: Math.max(...corners.map(corner => corner.z)),
        minY: module.position.y,
        maxY: module.position.y + module.height
    };
}

function computeFramingBounds() {
    const state = useEditorStore.getState();
    const modules = state.moduleIds
        .map(id => state.modulesById[id])
        .filter((module): module is StandModule => Boolean(module));
    const halfFloorWidth = state.floorSize.width / 2;
    const halfFloorDepth = state.floorSize.depth / 2;
    let minX = -halfFloorWidth;
    let maxX = halfFloorWidth;
    let minZ = -halfFloorDepth;
    let maxZ = halfFloorDepth;
    let minY = 0;
    let maxY = 1;

    for (const module of modules) {
        const footprint = getRotatedModuleFootprint(module);
        minX = Math.min(minX, footprint.minX);
        maxX = Math.max(maxX, footprint.maxX);
        minZ = Math.min(minZ, footprint.minZ);
        maxZ = Math.max(maxZ, footprint.maxZ);
        minY = Math.min(minY, footprint.minY);
        maxY = Math.max(maxY, footprint.maxY);
    }

    return {
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
        centerZ: (minZ + maxZ) / 2,
        width: Math.max(maxX - minX, 0.1),
        height: Math.max(maxY - minY, 0.1),
        depth: Math.max(maxZ - minZ, 0.1)
    };
}

function readRenderTargetToDataUrl(
    renderer: THREE.WebGLRenderer,
    target: THREE.WebGLRenderTarget
): string {
    const { width, height } = target;
    const pixels = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(target, 0, 0, width, height, pixels);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to read scene capture buffer.");
    }

    const imageData = context.createImageData(width, height);

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const srcIndex = ((height - y - 1) * width + x) * 4;
            const dstIndex = (y * width + x) * 4;
            imageData.data[dstIndex] = pixels[srcIndex]!;
            imageData.data[dstIndex + 1] = pixels[srcIndex + 1]!;
            imageData.data[dstIndex + 2] = pixels[srcIndex + 2]!;
            imageData.data[dstIndex + 3] = pixels[srcIndex + 3]!;
        }
    }

    context.putImageData(imageData, 0, 0);

    return canvas.toDataURL("image/png");
}

function renderOrthographic(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    pixelWidth: number,
    pixelHeight: number,
    camera: THREE.OrthographicCamera
): string {
    const target = new THREE.WebGLRenderTarget(pixelWidth, pixelHeight, {
        format: THREE.RGBAFormat,
        type: THREE.UnsignedByteType
    });

    const previousBackground = scene.background;
    scene.background = new THREE.Color(BACKGROUND_COLOR);

    try {
        renderer.setRenderTarget(target);
        renderer.render(scene, camera);
        renderer.setRenderTarget(null);

        return readRenderTargetToDataUrl(renderer, target);
    } finally {
        scene.background = previousBackground;
        target.dispose();
    }
}

/**
 * Front elevation: floor width (X) maps to the image width. The frustum only
 * grows beyond the floor width if a module is taller/wider than what fits.
 */
function captureFrontView(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    bounds: ReturnType<typeof computeFramingBounds>
): string {
    const frustumWidth = bounds.width * FRAME_PADDING;
    const frustumHeight = bounds.height * FRAME_PADDING;
    const pixelHeight = Math.max(180, Math.round(FRONT_WIDTH * (frustumHeight / frustumWidth)));

    const camera = new THREE.OrthographicCamera(
        -frustumWidth / 2,
        frustumWidth / 2,
        frustumHeight / 2,
        -frustumHeight / 2,
        0.01,
        bounds.depth * 4 + 100
    );
    camera.up.set(0, 1, 0);
    camera.position.set(bounds.centerX, bounds.centerY, bounds.centerZ + bounds.depth * 2 + 10);
    camera.lookAt(bounds.centerX, bounds.centerY, bounds.centerZ);
    camera.updateProjectionMatrix();

    return renderOrthographic(renderer, scene, FRONT_WIDTH, pixelHeight, camera);
}

/**
 * Top plan: floor width (X) and depth (Z) map to image width and height. The
 * render target adopts the footprint aspect so both dimensions fill the frame.
 */
function captureTopView(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    bounds: ReturnType<typeof computeFramingBounds>
): string {
    const footprintAspect = bounds.width / bounds.depth;

    let pixelWidth = TOP_MAX_DIMENSION;
    let pixelHeight = Math.round(TOP_MAX_DIMENSION / footprintAspect);

    if (pixelHeight > TOP_MAX_DIMENSION) {
        pixelHeight = TOP_MAX_DIMENSION;
        pixelWidth = Math.round(TOP_MAX_DIMENSION * footprintAspect);
    }

    const frustumWidth = bounds.width * FRAME_PADDING;
    const frustumHeight = bounds.depth * FRAME_PADDING;
    const height = Math.max(bounds.height, 1);

    const camera = new THREE.OrthographicCamera(
        -frustumWidth / 2,
        frustumWidth / 2,
        frustumHeight / 2,
        -frustumHeight / 2,
        0.01,
        height * 4 + 100
    );
    // Look straight down; -Z points to the top of the image so width=X, depth=Z.
    camera.up.set(0, 0, -1);
    camera.position.set(bounds.centerX, bounds.centerY + height * 2 + 10, bounds.centerZ);
    camera.lookAt(bounds.centerX, bounds.centerY, bounds.centerZ);
    camera.updateProjectionMatrix();

    return renderOrthographic(renderer, scene, pixelWidth, pixelHeight, camera);
}

/** Registers off-screen front/top render capture with the live editor canvas. */
export function SceneCaptureBridge() {
    const { gl, scene } = useThree();

    useEffect(() => {
        const capture = async (): Promise<StandScenePreviewViews | null> => {
            await waitForNextFrames(2);

            const grids: { grid: THREE.GridHelper; visible: boolean }[] = [];
            scene.traverse(object => {
                if (object instanceof THREE.GridHelper) {
                    grids.push({ grid: object, visible: object.visible });
                    object.visible = false;
                }
            });

            try {
                const bounds = computeFramingBounds();
                const front = captureFrontView(gl, scene, bounds);
                const top = captureTopView(gl, scene, bounds);

                return { front, top };
            } finally {
                for (const entry of grids) {
                    entry.grid.visible = entry.visible;
                }
            }
        };

        registerSceneCapture(capture);

        return () => {
            registerSceneCapture(null);
        };
    }, [gl, scene]);

    return null;
}
