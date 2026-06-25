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

type ARSessionInitWithOverlay = XRSessionInit & {
    domOverlay?: { root: Element };
};

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
            if (placed || !reticleRef.current || !reticleRef.current.visible) {
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

function ARSceneController({ mode }: { mode: "xr" | "fallback" }) {
    const { gl } = useThree();
    const [placed, setPlaced] = useState(() => arService.getSession().placed);
    const reticleRef = useRef<Mesh>(null);

    useEffect(() => {
        useEditorStore.getState().setReadOnly(true);
    }, []);

    useEffect(() => arService.subscribe(session => setPlaced(session.placed)), []);

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
    const [supported, setSupported] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [isStarting, setIsStarting] = useState(false);
    const glRef = useRef<WebGLRenderer | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const xrSessionRef = useRef<XRSession | null>(null);

    useLayoutEffect(() => {
        RectAreaLightUniformsLib.init();
    }, []);

    useEffect(() => {
        void checkARSupport().then(nextSession => {
            setSession(nextSession);
            setSupported(nextSession.supported);
            startARSession();
        });

        return arService.subscribe(setSession);
    }, []);

    // The XR session MUST be requested from within the user gesture (the button
    // tap). Requesting it after async work / re-renders drops the activation and
    // the request silently fails — which looked like "nothing happens".
    const handleStartAR = async () => {
        const gl = glRef.current;

        if (typeof navigator === "undefined" || !navigator.xr || !gl) {
            setMessage("AR is unavailable on this device. Showing 3D preview.");
            return;
        }

        setIsStarting(true);
        setMessage(null);

        try {
            const sessionInit: ARSessionInitWithOverlay = {
                requiredFeatures: ["hit-test"],
                optionalFeatures: ["local-floor", "dom-overlay"]
            };

            if (overlayRef.current) {
                sessionInit.domOverlay = { root: overlayRef.current };
            }

            const xrSession = await navigator.xr.requestSession("immersive-ar", sessionInit);
            xrSessionRef.current = xrSession;

            gl.xr.enabled = true;
            gl.setClearColor(0x000000, 0);
            await gl.xr.setSession(xrSession);

            startARSession();
            setMode("xr");

            xrSession.addEventListener(
                "end",
                () => {
                    xrSessionRef.current = null;
                    exitAR();
                    onExit();
                },
                { once: true }
            );
        } catch (error) {
            console.warn("WebXR AR session failed.", error);
            setMessage("Couldn't start camera AR. Showing 3D preview instead.");
            setMode("fallback");
        } finally {
            setIsStarting(false);
        }
    };

    const handleExit = () => {
        const xrSession = xrSessionRef.current;

        if (xrSession) {
            xrSessionRef.current = null;
            void xrSession.end();
        }

        exitAR();
        onExit();
    };

    const hudLabel =
        mode === "xr" ? "AR Preview" : supported ? "Ready for AR" : "3D Preview";

    const hudTitle =
        mode === "xr"
            ? session.placed
                ? "Placed — walk around to view it at real size"
                : "Move your phone to scan the floor, then tap to place"
            : supported
                ? "Tap “Start AR” to place the stand in your room"
                : session.placed
                    ? "Project placed"
                    : "Drag to orbit, then tap the floor to place";

    return (
        <div ref={overlayRef} style={styles.overlay}>
            <div style={styles.hud}>
                <div style={styles.hudText}>
                    <div style={styles.hudLabel}>{hudLabel}</div>
                    <div style={styles.hudTitle}>{hudTitle}</div>
                </div>
                <div style={styles.hudActions}>
                    {supported && mode !== "xr" && (
                        <button
                            type="button"
                            style={styles.startButton}
                            onClick={() => void handleStartAR()}
                            disabled={isStarting}
                        >
                            {isStarting ? "Starting…" : "Start AR"}
                        </button>
                    )}
                    <button type="button" style={styles.exitButton} onClick={handleExit}>
                        Exit
                    </button>
                </div>
            </div>

            {message && <div style={styles.fallbackBanner}>{message}</div>}
            {!message && !supported && (
                <div style={styles.fallbackBanner}>
                    Camera AR isn’t supported by this browser. Showing an interactive 3D
                    preview instead.
                </div>
            )}

            <Canvas
                gl={{ toneMappingExposure: 1.3, alpha: true }}
                onCreated={({ gl }) => {
                    glRef.current = gl;
                    gl.xr.enabled = false;
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
                <ARSceneController mode={mode} />
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
    hudText: {
        minWidth: 0
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
    hudActions: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        flexShrink: 0
    },
    startButton: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 14px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        fontWeight: 600
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
