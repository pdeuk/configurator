import { useCallback, useMemo, useRef } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Position3, StandModule } from "../models/ModuleModel";
import { findSnap } from "../snapping/SnapEngine";
import type { SnapAxis } from "../snapping/SnapTypes";
import { useEditorStore } from "../store/editorStore";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function DragController() {
    const drag = useEditorStore(state => state.drag);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const updateModulePosition = useEditorStore(state => state.updateModulePosition);
    const endDrag = useEditorStore(state => state.endDrag);
    const snapPosition = useEditorStore(state => state.snapPosition);
    const setSnapPosition = useEditorStore(state => state.setSnapPosition);
    const select = useEditorStore(state => state.select);
    const lockedAxisRef = useRef<SnapAxis | null>(null);

    const modules = useMemo(
        () => moduleIds.map(id => modulesById[id]).filter(isStandModule),
        [moduleIds, modulesById]
    );

    const clearDrag = useCallback(() => {
        setSnapPosition(null);
        lockedAxisRef.current = null;
        endDrag();
    }, [endDrag, setSnapPosition]);

    const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();

        if (!drag) {
            return;
        }

        const moving = modulesById[drag.id];

        if (!moving) {
            clearDrag();
            return;
        }

        const rawPosition: Position3 = {
            x: event.point.x + drag.offset.x,
            y: 0,
            z: event.point.z + drag.offset.z
        };

        const lockedAxis = lockedAxisRef.current;
        const positionToMove: Position3 = lockedAxis
            ? {
                ...moving.position,
                [lockedAxis]: rawPosition[lockedAxis]
            }
            : rawPosition;

        const previewModule = {
            ...moving,
            position: positionToMove
        };

        const snap = findSnap(previewModule, modules);
        const nextPosition = snap?.position ?? positionToMove;

        lockedAxisRef.current = snap?.axis ?? null;
        setSnapPosition(snap?.position ?? null);
        updateModulePosition(drag.id, nextPosition);
    }, [
        clearDrag,
        drag,
        modules,
        modulesById,
        setSnapPosition,
        updateModulePosition
    ]);

    const handlePointerDown = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();

        if (!drag) {
            select(null);
        }
    }, [drag, select]);

    const handlePointerUp = useCallback((event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();

        if (drag && snapPosition) {
            updateModulePosition(drag.id, snapPosition);
        }

        clearDrag();
    }, [clearDrag, drag, snapPosition, updateModulePosition]);

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.01, 0]}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
        >
            <planeGeometry args={[100, 100]} />

            <meshBasicMaterial
                transparent
                opacity={0}
            />
        </mesh>
    );
}
