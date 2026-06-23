import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { DoubleSide, Matrix4, Vector3, type Mesh, type WebGLRenderer } from "three";
import { ClampedOrbitControls } from "./ClampedOrbitControls";
import { StandSceneContent } from "./StandSceneContent";
import { useEditorStore } from "../store/editorStore";
import {
    arService,
    checkARSupport,
    exitAR,
    placeProject,
    startARSession,
    type ARSession
} from "../services/ar";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

interface ARSceneProps {
    onExit: () => void;
}

function ARProjectGroup() {
    const [session, setSession] = useState<ARSession>(() => arService.getSession());
    const [anchor, setAnchor] = useState(() => arService.getAnchor());

    useEffect(() => {
        return arService.subscribe(nextSession => {
            setSession(nextSession);
            setAnchor(arService.getAnchor());
        });
    }, []);

    if (!session.placed || !anchor) {
        return null;
    }

    return (
        <group
            position={anchor.position}
            rotation={[0, anchor.rotationY, 0]}
            scale={session.scale}
        >
            <StandSceneContent showGrid={false} showFloor={false} />
        </group>
    );
}

function ARFallbackPlacement() {
    const [placed, setPlaced] = useState(() => arService.getSession().placed);

    useEffect(() => arService.subscribe(session => setPlaced(session.placed)), []);

    const handleFloorPointerDown = (event: ThreeEvent<PointerEvent>) => {
        if (placed) {
            return;
        }

        event.stopPropagation();

        const point = event.point;
        placeProject({
            position: [point.x, point.y, point.z],
            rotationY: 0
        });
    };

    return (
        <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0, 0]}
            onPointerDown={handleFloorPointerDown}
        >
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial visible={false} />
        </mesh>
    );
}

function ARXRPlacement({
    renderer,
    reticleRef
}: {
    renderer: WebGLRenderer;
    reticleRef: RefObject<Mesh | null>;
}) {
    const [placed, setPlaced] = useState(() => arService.getSession().placed);
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
    const referenceSpaceRef = useRef<XRReferenceSpace | null>(null);
    const tempMatrix = useMemo(() => new Matrix4(), []);
    const reticlePosition = useMemo(() => new Vector3(), []);

    useEffect(() => arService.subscribe(session => setPlaced(session.placed)), []);

    useEffect(() => {
        const session = renderer.xr.getSession();

        if (!session) {
            return;
        }

        let cancelled = false;

        void (async () => {
            referenceSpaceRef.current = await session.requestReferenceSpace("local");

            if (cancelled || !referenceSpaceRef.current) {
                return;
            }

            const viewerSpace = await session.requestReferenceSpace("viewer");

            if (cancelled || typeof session.requestHitTestSource !== "function") {
                return;
            }

            hitTestSourceRef.current =
                (await session.requestHitTestSource({ space: viewerSpace })) ?? null;
        })();

        const handleSelect = () => {
            if (placed || !reticleRef.current) {
                return;
            }

            reticleRef.current.getWorldPosition(reticlePosition);

            placeProject({
                position: [reticlePosition.x, reticlePosition.y, reticlePosition.z],
                rotationY: reticleRef.current.rotation.y
            });
        };

        session.addEventListener("select", handleSelect);

        return () => {
            cancelled = true;
            session.removeEventListener("select", handleSelect);
            hitTestSourceRef.current?.cancel();
            hitTestSourceRef.current = null;
            referenceSpaceRef.current = null;
        };
    }, [placed, renderer, reticlePosition, reticleRef]);

    useFrame((_state, _delta, frame) => {
        if (placed || !frame || !hitTestSourceRef.current || !referenceSpaceRef.current || !reticleRef.current) {
            return;
        }

        const results = frame.getHitTestResults(hitTestSourceRef.current);

        if (results.length === 0) {
            reticleRef.current.visible = false;
            return;
        }

        const pose = results[0]?.getPose(referenceSpaceRef.current);

        if (!pose) {
            reticleRef.current.visible = false;
            return;
        }

        tempMatrix.fromArray(pose.transform.matrix);
        reticleRef.current.matrix.copy(tempMatrix);
        reticleRef.current.matrix.decompose(
            reticleRef.current.position,
            reticleRef.current.quaternion,
            reticleRef.current.scale
        );
        reticleRef.current.visible = true;
    });

    if (placed) {
        return null;
    }

    return (
        <mesh ref={reticleRef} visible={false}>
            <ringGeometry args={[0.12, 0.16, 32]} />
            <meshBasicMaterial color="#60a5fa" transparent opacity={0.85} side={DoubleSide} />
        </mesh>
    );
}

function ARSceneController({
    mode,
    onFallback
}: {
    mode: "xr" | "fallback";
    onFallback: () => void;
}) {
    const { gl } = useThree();
    const [placed, setPlaced] = useState(() => arService.getSession().placed);
    const reticleRef = useRef<Mesh>(null);

    useEffect(() => {
        useEditorStore.getState().setReadOnly(true);
    }, []);

    useEffect(() => arService.subscribe(session => setPlaced(session.placed)), []);

    useEffect(() => {
        if (mode !== "xr") {
            return;
        }

        let cancelled = false;

        void (async () => {
            if (!navigator.xr) {
                onFallback();
                return;
            }

            try {
                const session = await navigator.xr.requestSession("immersive-ar", {
                    requiredFeatures: ["hit-test"],
                    optionalFeatures: ["local-floor"]
                });

                if (cancelled) {
                    await session.end();
                    return;
                }

                gl.setClearColor(0x000000, 0);
                await gl.xr.setSession(session);
            } catch (error) {
                console.warn("WebXR AR session failed.", error);
                onFallback();
            }
        })();

        return () => {
            cancelled = true;
            const session = gl.xr.getSession();

            if (session) {
                void session.end();
            }
        };
    }, [gl, mode, onFallback]);

    return (
        <>
            {mode === "fallback" && !placed && <ARFallbackPlacement />}
            {mode === "fallback" && <ClampedOrbitControls enabled={!placed} />}
            {mode === "xr" && !placed && (
                <ARXRPlacement renderer={gl} reticleRef={reticleRef} />
            )}
            <ARProjectGroup />
        </>
    );
}

export function ARScene({ onExit }: ARSceneProps) {
    const [session, setSession] = useState<ARSession>(() => arService.getSession());
    const [mode, setMode] = useState<"xr" | "fallback">("fallback");

    useLayoutEffect(() => {
        RectAreaLightUniformsLib.init();
    }, []);

    useEffect(() => {
        void checkARSupport().then(nextSession => {
            setSession(nextSession);
            setMode(nextSession.supported ? "xr" : "fallback");
            startARSession();
        });

        return arService.subscribe(setSession);
    }, []);

    const handleExit = () => {
        exitAR();
        onExit();
    };

    return (
        <div style={styles.overlay}>
            <div style={styles.hud}>
                <div>
                    <div style={styles.hudLabel}>
                        {mode === "xr" && session.supported ? "AR Preview" : "3D Preview"}
                    </div>
                    <div style={styles.hudTitle}>
                        {session.placed
                            ? "Project placed"
                            : mode === "xr"
                                ? "Tap the floor to place the stand"
                                : "Tap the floor or orbit, then tap to place"}
                    </div>
                </div>
                <button type="button" style={styles.exitButton} onClick={handleExit}>
                    Exit
                </button>
            </div>

            {!session.supported && (
                <div style={styles.fallbackBanner}>
                    AR is not supported on this device. Showing 3D preview mode instead.
                </div>
            )}

            <Canvas
                key={mode}
                gl={{ toneMappingExposure: 1.3, alpha: mode === "xr" }}
                onCreated={({ gl }) => {
                    gl.xr.enabled = mode === "xr";
                }}
                camera={{
                    position: [5, 4, 5],
                    fov: 45
                }}
                style={{ width: "100%", height: "100%" }}
            >
                {mode === "fallback" && (
                    <color attach="background" args={["#525862"]} />
                )}
                <ARSceneController mode={mode} onFallback={() => setMode("fallback")} />
            </Canvas>
        </div>
    );
}

const styles = {
    overlay: {
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "#171a20"
    },
    hud: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 20,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "rgba(32, 36, 43, 0.92)",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        pointerEvents: "auto"
    },
    hudLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    hudTitle: {
        marginTop: 4,
        fontSize: 14,
        fontWeight: 600,
        color: "#f7f7f2"
    },
    exitButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    fallbackBanner: {
        position: "absolute",
        top: 88,
        left: 20,
        right: 20,
        zIndex: 2,
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #4b5562",
        background: "rgba(45, 52, 64, 0.92)",
        color: "#d1d5db",
        fontSize: 12
    }
} satisfies Record<string, import("react").CSSProperties>;
