import { useState } from "react";
import type { CSSProperties } from "react";
import { Html, Line } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { useEditorStore } from "../store/editorStore";
import type { StandModule } from "../models/ModuleModel";
import {
    type ExhibitionWallAttachSide
} from "../utils/wallLayout";

type Side = "left" | "right";

const LINE_LENGTH = 0.45;
const LINE_COLOR = "#a855f7";
const DIAMOND_SIZE = 0.08;
const DIAMOND_HIT_SIZE = 0.28;
const MENU_GAP = 0.06;

interface SideConfig {
    side: Side;
    dir: number;
    edgeX: number;
}

const MENU_OPTIONS = [
    { id: "frame-square", label: "Frame square" },
    { id: "option-2", label: "Option 2" },
    { id: "option-3", label: "Option 3" }
] as const;

interface ExhibitionWallSideHandlesProps {
    module: StandModule;
}

export function ExhibitionWallSideHandles({
    module
}: ExhibitionWallSideHandlesProps) {
    const beginFrameSquarePlacement = useEditorStore(
        state => state.beginFrameSquarePlacement
    );
    const frameSquarePlacement = useEditorStore(state => state.frameSquarePlacement);
    const [menuSide, setMenuSide] = useState<Side | null>(null);

    const handleOptionSelect = (optionId: string, side: ExhibitionWallAttachSide) => {
        if (optionId !== "frame-square") {
            return;
        }

        beginFrameSquarePlacement(module.id, side);
        setMenuSide(null);
    };

    if (frameSquarePlacement) {
        return null;
    }

    const half = module.width / 2;
    const sides: SideConfig[] = [
        { side: "left", dir: -1, edgeX: -half },
        { side: "right", dir: 1, edgeX: half }
    ];

    return (
        <>
            {sides.map(({ side, dir, edgeX }) => {
                const endX = edgeX + dir * LINE_LENGTH;

                return (
                    <group key={side}>
                        <Line
                            points={[
                                [edgeX, 0, 0],
                                [endX, 0, 0]
                            ]}
                            color={LINE_COLOR}
                            lineWidth={3}
                            depthTest={false}
                            renderOrder={10}
                        />

                        <group position={[endX, 0, 0]}>
                            <mesh
                                renderOrder={12}
                                onPointerDown={(event: ThreeEvent<PointerEvent>) => {
                                    event.stopPropagation();
                                }}
                                onPointerOver={() => {
                                    document.body.style.cursor = "pointer";
                                }}
                                onPointerOut={() => {
                                    document.body.style.cursor = "auto";
                                }}
                                onClick={(event: ThreeEvent<MouseEvent>) => {
                                    event.stopPropagation();
                                    setMenuSide(previous =>
                                        previous === side ? null : side
                                    );
                                }}
                            >
                                <boxGeometry
                                    args={[DIAMOND_HIT_SIZE, DIAMOND_HIT_SIZE, DIAMOND_HIT_SIZE]}
                                />
                                <meshBasicMaterial
                                    transparent
                                    opacity={0}
                                    depthWrite={false}
                                    depthTest={false}
                                />
                            </mesh>

                            <mesh
                                rotation={[0, 0, Math.PI / 4]}
                                renderOrder={11}
                                raycast={() => null}
                            >
                                <boxGeometry args={[DIAMOND_SIZE, DIAMOND_SIZE, 0.012]} />
                                <meshBasicMaterial color={LINE_COLOR} depthTest={false} />
                            </mesh>
                        </group>

                        {menuSide === side && (
                            <Html
                                position={[endX + dir * MENU_GAP, 0, 0]}
                                zIndexRange={[60, 0]}
                                style={{ pointerEvents: "none" }}
                            >
                                <div
                                    style={{
                                        ...menuStyles.container,
                                        transform: dir < 0
                                            ? "translate(-100%, -50%)"
                                            : "translate(0, -50%)"
                                    }}
                                    onPointerDown={event => event.stopPropagation()}
                                >
                                    {MENU_OPTIONS.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            style={menuStyles.thumbnail}
                                            onClick={event => {
                                                event.stopPropagation();
                                                handleOptionSelect(option.id, side);
                                            }}
                                        >
                                            <span style={menuStyles.thumbnailPreview} />
                                            <span style={menuStyles.thumbnailLabel}>
                                                {option.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </Html>
                        )}
                    </group>
                );
            })}
        </>
    );
}

const menuStyles: Record<string, CSSProperties> = {
    container: {
        display: "flex",
        gap: 8,
        padding: 8,
        background: "rgba(24, 26, 32, 0.95)",
        border: "1px solid #a855f7",
        borderRadius: 10,
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
        pointerEvents: "auto"
    },
    thumbnail: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: 6,
        width: 64,
        background: "transparent",
        border: "none",
        cursor: "pointer"
    },
    thumbnailPreview: {
        width: 52,
        height: 52,
        borderRadius: 8,
        background: "linear-gradient(135deg, #6d28d9, #a855f7)",
        border: "1px solid rgba(255, 255, 255, 0.18)"
    },
    thumbnailLabel: {
        fontSize: 11,
        lineHeight: "14px",
        color: "#e7e3f5",
        fontFamily: "system-ui, sans-serif",
        whiteSpace: "nowrap"
    }
};
