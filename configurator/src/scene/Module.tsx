import { memo, useCallback } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useEditorStore } from "../store/editorStore";
import type { StandModule } from "../models/ModuleModel";
import { getBannerSelectionHitSize } from "../utils/bannerGeometry";
import { CircularBannerFabricSurface } from "./CircularBannerFabricSurface";
import { CircularBannerFrame } from "./CircularBannerFrame";
import { CubeFabricSurface } from "./CubeFabricSurface";
import { CubeFrame } from "./CubeFrame";
import { FabricSurface } from "./FabricSurface";
import { WallFrame } from "./WallFrame";
import { getFrameConnectionLayout } from "./frameConnections";
import { ignoreRaycast } from "./raycast";

const SELECTION_HIT_PADDING = 0.05;
const MIN_SELECTION_HIT_DEPTH = 0.18;

function getSelectionHitSize(module: StandModule) {
    return {
        width: module.width + SELECTION_HIT_PADDING * 2,
        height: module.height + SELECTION_HIT_PADDING * 2,
        depth: Math.max(module.depth + SELECTION_HIT_PADDING * 2, MIN_SELECTION_HIT_DEPTH)
    };
}

interface Props {
    module: StandModule;
    modules: StandModule[];
}

function ModuleComponent({ module, modules }: Props) {
    const selectedId = useEditorStore(state => state.selectedId);
    const select = useEditorStore(state => state.select);
    const beginDrag = useEditorStore(state => state.beginDrag);

    const isSelected = selectedId === module.id;
    const connectionLayout = getFrameConnectionLayout(module, modules);
    const isCube = module.type === "cube";
    const isCircularBanner = module.type === "circularBanner";
    const hitSize = isCircularBanner
        ? getBannerSelectionHitSize(module)
        : getSelectionHitSize(module);

    const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();

        if (event.target instanceof Element) {
            event.target.setPointerCapture(event.pointerId);
        }

        select(module.id);
        beginDrag(module.id, {
            x: module.position.x - event.point.x,
            y: 0,
            z: module.position.z - event.point.z
        });
    }, [beginDrag, module.id, module.position.x, module.position.z, select]);

    const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
        if (event.target instanceof Element && event.target.hasPointerCapture(event.pointerId)) {
            event.target.releasePointerCapture(event.pointerId);
        }
    }, []);

    return (
        <group
            position={[
                module.position.x,
                module.position.y + module.height / 2,
                module.position.z
            ]}
            rotation={[
                0,
                module.rotation,
                0
            ]}
        >
            <mesh
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                <boxGeometry
                    args={[
                        hitSize.width,
                        hitSize.height,
                        hitSize.depth
                    ]}
                />
                <meshBasicMaterial
                    transparent
                    opacity={0}
                    depthWrite={false}
                />
            </mesh>
            {isCircularBanner ? (
                <>
                    <CircularBannerFabricSurface module={module} />
                    <CircularBannerFrame
                        module={module}
                        color={isSelected ? "orange" : "white"}
                    />
                </>
            ) : isCube ? (
                <>
                    <CubeFabricSurface module={module} />
                    <CubeFrame
                        module={module}
                        color={isSelected ? "orange" : "white"}
                    />
                </>
            ) : (
                <>
                    <FabricSurface
                        module={module}
                        connectionLayout={connectionLayout.fabric}
                    />
                    <WallFrame
                        module={module}
                        color={isSelected ? "orange" : "white"}
                        hiddenSides={connectionLayout.hiddenSides}
                    />
                </>
            )}
            {isSelected && (
                <mesh
                    scale={
                        isCircularBanner
                            ? [1.03, 1.03, 1.03]
                            : isCube
                                ? [1.03, 1.03, 1.03]
                                : [1.03, 1.03, 1.35]
                    }
                    raycast={ignoreRaycast}
                >
                    <boxGeometry
                        args={
                            isCircularBanner
                                ? [
                                    module.width,
                                    module.height,
                                    module.width
                                ]
                                : [
                                    module.width,
                                    module.height,
                                    module.depth
                                ]
                        }
                    />
                    <meshBasicMaterial
                        color="#1f8cff"
                        wireframe
                    />
                </mesh>
            )}
        </group>
    );
}

export const Module = memo(ModuleComponent);
