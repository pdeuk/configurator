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

interface PlacementTarget {
    position: [number, number, number];
    rotationY: number;
    valid: boolean;
}

type PlacementTargetRef = RefObject<PlacementTarget>;

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
    reticleRef,
    placementTargetRef
}: {
    renderer: WebGLRenderer;
    reticleRef: RefObject<Mesh | null>;
    placementTargetRef: PlacementTargetRef;
}) {
    const [placed, setPlaced] = useState(() => arService.getSession().placed);
    const hitTestSourceRef = useRef<XRHitTestSource | null>(null);
    const referenceSpaceRef = useRef<XRReferenceSpace | null>(null);
    const usingLocalFloorRef = useRef(false);
    const tempMatrix = useMemo(() => new Matrix4(), []);
    const reticlePosition = useMemo(() => new Vector3(), []);
    const viewerPosition = useMemo(() => new Vector3(), []);
    const forwardVector = useMemo(() => new Vector3(), []);

    useEffect(() => arService.subscribe(session => setPlaced(session.placed)), []);

    useEffect(() => {
        const session = renderer.xr.getSession();

        if (!session) {
            return;
        }

        let cancelled = false;

        void (async () => {
            // Prefer a floor-anchored space; fall back to a generic local space.
            try {
                referenceSpaceRef.current = await session.requestReferenceSpace("local-floor");
                usingLocalFloorRef.current = true;
            } catch {
                referenceSpaceRef.current = await session.requestReferenceSpace("local");
                usingLocalFloorRef.current = false;
            }

            if (cancelled || !referenceSpaceRef.current) {
                return;
            }

            if (typeof session.requestHitTestSource !== "function") {
                return;
            }

            try {
                const viewerSpace = await session.requestReferenceSpace("viewer");
                hitTestSourceRef.current =
                    (await session.requestHitTestSource?.({ space: viewerSpace })) ?? null;
            } catch {
                // Device/browser didn't grant hit-test — we'll place in front instead.
                hitTestSourceRef.current = null;
            }
        })();

        const handleSelect = () => {
            const target = placementTargetRef.current;

            if (placed || !target || !target.valid) {
                return;
            }

            placeProject({
                position: target.position,
                rotationY: target.rotationY
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
    }, [placed, renderer, reticleRef, placementTargetRef]);

    useFrame((_state, _delta, frame) => {
        if (placed || !frame || !referenceSpaceRef.current || !reticleRef.current) {
            return;
        }

        // Preferred path: real surface detection via hit-test.
        if (hitTestSourceRef.current) {
            const results = frame.getHitTestResults(hitTestSourceRef.current);
            const pose = results[0]?.getPose(referenceSpaceRef.current);

            if (pose) {
                tempMatrix.fromArray(pose.transform.matrix);
                tempMatrix.decompose(
                    reticleRef.current.position,
                    reticleRef.current.quaternion,
                    reticleRef.current.scale
                );
                reticleRef.current.visible = true;
                reticleRef.current.getWorldPosition(reticlePosition);

                if (placementTargetRef.current) {
                    placementTargetRef.current.position = [
                        reticlePosition.x,
                        reticlePosition.y,
                        reticlePosition.z
                    ];
                    placementTargetRef.current.rotationY = reticleRef.current.rotation.y;
                    placementTargetRef.current.valid = true;
                }

                return;
            }
        }

        // Fallback (no hit-test, or no surface yet): project a target ~1.6m in
        // front of the viewer, dropped to floor level, so placement always works.
        const viewerPose = frame.getViewerPose(referenceSpaceRef.current);

        if (!viewerPose) {
            return;
        }

        tempMatrix.fromArray(viewerPose.transform.matrix);
        viewerPosition.setFromMatrixPosition(tempMatrix);
        forwardVector
            .set(-tempMatrix.elements[8], 0, -tempMatrix.elements[10])
            .normalize();

        const floorY = usingLocalFloorRef.current ? 0 : viewerPosition.y - 1.4;
        const targetX = viewerPosition.x + forwardVector.x * 1.6;
        const targetZ = viewerPosition.z + forwardVector.z * 1.6;

        reticleRef.current.position.set(targetX, floorY, targetZ);
        reticleRef.current.quaternion.set(0, 0, 0, 1);
        reticleRef.current.visible = true;

        if (placementTargetRef.current) {
            placementTargetRef.current.position = [targetX, floorY, targetZ];
            placementTargetRef.current.rotationY = 0;
            placementTargetRef.current.valid = true;
        }
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
    placementTargetRef
}: {
    mode: "xr" | "fallback";
    placementTargetRef: PlacementTargetRef;
}) {
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
                <ARXRPlacement
                    renderer={gl}
                    reticleRef={reticleRef}
                    placementTargetRef={placementTargetRef}
                />
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
    const placementTargetRef = useRef<PlacementTarget>({
        position: [0, 0, 0],
        rotationY: 0,
        valid: false
    });

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
            // Keep every feature optional: requiring "hit-test" makes some
            // ARCore devices reject the whole session with NotSupportedError.
            // We degrade gracefully if hit-test isn't granted (see ARXRPlacement).
            const sessionInit: ARSessionInitWithOverlay = {
                optionalFeatures: ["local-floor", "hit-test", "dom-overlay"]
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

            const detail =
                error instanceof Error
                    ? `${error.name}: ${error.message}`
                    : String(error);

            setMessage(`Couldn't start camera AR (${detail}). Showing 3D preview instead.`);
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

    const handlePlaceHere = () => {
        const target = placementTargetRef.current;

        if (!target.valid) {
            return;
        }

        placeProject({
            position: target.position,
            rotationY: target.rotationY
        });
    };

    const handleReposition = () => {
        placementTargetRef.current.valid = false;
        startARSession();
    };

    const hudLabel =
        mode === "xr" ? "AR Preview" : supported ? "Ready for AR" : "3D Preview";

    const hudTitle =
        mode === "xr"
            ? session.placed
                ? "Placed — walk around to view it at real size"
                : "Aim at the floor, then tap the screen or “Place here”"
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
                    {mode === "xr" && !session.placed && (
                        <button
                            type="button"
                            style={styles.startButton}
                            onClick={handlePlaceHere}
                        >
                            Place here
                        </button>
                    )}
                    {mode === "xr" && session.placed && (
                        <button
                            type="button"
                            style={styles.exitButton}
                            onClick={handleReposition}
                        >
                            Reposition
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
                <ARSceneController mode={mode} placementTargetRef={placementTargetRef} />
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
