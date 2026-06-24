import { memo, useCallback, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import { useEditorStore } from "../store/editorStore";
import type { StandModule } from "../models/ModuleModel";
import { getBannerSelectionHitSize } from "../utils/bannerGeometry";
import { isHangingBannerType, isPromoStandType } from "../models/ModuleModel";
import { CircularBannerFabricSurface } from "./CircularBannerFabricSurface";
import { CircularBannerFrame } from "./CircularBannerFrame";
import { SquareBannerFabricSurface } from "./SquareBannerFabricSurface";
import { SquareBannerFrame } from "./SquareBannerFrame";
import { CubeFabricSurface } from "./CubeFabricSurface";
import { CubeFrame } from "./CubeFrame";
import { PromoStandFabricSurface } from "./PromoStandFabricSurface";
import { PromoStandFrame } from "./PromoStandFrame";
import { FabricSurface } from "./FabricSurface";
import { WallFrame } from "./WallFrame";
import { getFrameConnectionLayout } from "./frameConnections";
import { ignoreRaycast } from "./raycast";

const SELECTION_HIT_PADDING = 0.05;
const MIN_SELECTION_HIT_DEPTH = 0.18;
const DRAG_THRESHOLD_PX = 4;

interface PendingDrag {
    pointerId: number;
    startX: number;
    startY: number;
    offset: {
        x: number;
        y: number;
        z: number;
    };
}

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
    const readOnly = useEditorStore(state => state.readOnly);
    const select = useEditorStore(state => state.select);
    const beginDrag = useEditorStore(state => state.beginDrag);
    const dragPendingRef = useRef<PendingDrag | null>(null);

    const isSelected = !readOnly && selectedId === module.id;
    const connectionLayout = getFrameConnectionLayout(module, modules);
    const isCube = module.type === "cube";
    const isPromoStand = isPromoStandType(module.type);
    const isBoxLike = isCube || isPromoStand;
    const isCircularBanner = module.type === "circularBanner";
    const isSquareBanner = module.type === "squareBanner";
    const isHangingBanner = isHangingBannerType(module.type);
    const hitSize = isHangingBanner
        ? getBannerSelectionHitSize(module)
        : getSelectionHitSize(module);

    const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();

        if (!isSelected) {
            select(module.id);
            return;
        }

        if (event.target instanceof Element) {
            event.target.setPointerCapture(event.pointerId);
        }

        dragPendingRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            offset: {
                x: module.position.x - event.point.x,
                y: 0,
                z: module.position.z - event.point.z
            }
        };
    }, [isSelected, module.id, module.position.x, module.position.z, select]);

    const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
        const pending = dragPendingRef.current;

        if (!pending || pending.pointerId !== event.pointerId) {
            return;
        }

        const deltaX = event.clientX - pending.startX;
        const deltaY = event.clientY - pending.startY;

        if (Math.hypot(deltaX, deltaY) < DRAG_THRESHOLD_PX) {
            return;
        }

        event.stopPropagation();
        dragPendingRef.current = null;

        if (event.target instanceof Element && event.target.hasPointerCapture(event.pointerId)) {
            event.target.releasePointerCapture(event.pointerId);
        }

        beginDrag(module.id, pending.offset);
    }, [beginDrag, module.id]);

    const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
        dragPendingRef.current = null;

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
            {!readOnly && (
                <mesh
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
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
            )}
            {isCircularBanner ? (
                <>
                    <CircularBannerFabricSurface module={module} />
                    <CircularBannerFrame
                        module={module}
                        color={isSelected ? "orange" : "white"}
                    />
                </>
            ) : isSquareBanner ? (
                <>
                    <SquareBannerFabricSurface module={module} />
                    <SquareBannerFrame
                        module={module}
                        color={isSelected ? "orange" : "white"}
                    />
                </>
            ) : isPromoStand ? (
                <>
                    <PromoStandFabricSurface module={module} />
                    <PromoStandFrame
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
                        isHangingBanner
                            ? [1.03, 1.03, 1.03]
                            : isBoxLike
                                ? [1.03, 1.03, 1.03]
                                : [1.03, 1.03, 1.35]
                    }
                    raycast={ignoreRaycast}
                >
                    <boxGeometry
                        args={
                            isHangingBanner
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
