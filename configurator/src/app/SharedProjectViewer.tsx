import { useEffect, useState } from "react";
import { hydrateModulesArtwork } from "../lib/artworkAssetHydration";
import { projectDocumentToPersistableState } from "../lib/projectSerialization";
import { customerService, type CustomerProjectPermissions } from "../services/customer";
import { loadSharedProject } from "../services/sharing";
import { ARScene } from "../scene/ARScene";
import { StandCanvas } from "../scene/StandCanvas";
import { exitAR } from "../services/ar";
import { useEditorStore } from "../store/editorStore";
import { ReviewSidebar } from "../ui/reviews";

interface SharedProjectViewerProps {
    shareToken?: string;
    portalProjectId?: string;
    customerId?: string;
    permissions?: CustomerProjectPermissions;
}

export function SharedProjectViewer({
    shareToken,
    portalProjectId,
    customerId,
    permissions
}: SharedProjectViewerProps) {
    const [projectName, setProjectName] = useState("Shared project");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isARPreviewOpen, setIsARPreviewOpen] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            setIsLoading(true);
            setError(null);

            try {
                let project = null;

                if (shareToken) {
                    const result = await loadSharedProject(shareToken);

                    if (!result) {
                        if (!cancelled) {
                            setError("This share link is invalid, disabled, or expired.");
                            setIsLoading(false);
                        }

                        return;
                    }

                    project = result.project;
                } else if (portalProjectId && customerId) {
                    project = await customerService.loadProjectForCustomer(
                        customerId,
                        portalProjectId
                    );

                    if (!project) {
                        if (!cancelled) {
                            setError("This project is unavailable or access was revoked.");
                            setIsLoading(false);
                        }

                        return;
                    }
                } else {
                    if (!cancelled) {
                        setError("Project viewer is missing access context.");
                        setIsLoading(false);
                    }

                    return;
                }

                const persistableState = projectDocumentToPersistableState(project);
                const modulesById = await hydrateModulesArtwork(persistableState.modulesById);

                if (cancelled) {
                    return;
                }

                useEditorStore.getState().loadProjectDocument(project);
                useEditorStore.setState({ modulesById });
                useEditorStore.getState().setReadOnly(true);
                setProjectName(project.name);
                setIsLoading(false);
            } catch (loadError) {
                console.warn("Shared project load failed.", loadError);

                if (!cancelled) {
                    setError("Unable to load the shared project.");
                    setIsLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            useEditorStore.getState().setReadOnly(false);
        };
    }, [shareToken, portalProjectId, customerId]);

    if (isLoading) {
        return (
            <div style={styles.page}>
                <div style={styles.message}>Loading shared project…</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={styles.page}>
                <div style={styles.errorPanel}>
                    <h1 style={styles.errorTitle}>Share link unavailable</h1>
                    <p style={styles.errorText}>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div>
                    <div style={styles.headerLabel}>
                        {shareToken ? "Shared project" : "Customer portal"}
                    </div>
                    <div style={styles.headerTitle}>{projectName}</div>
                </div>
                <div style={styles.headerActions}>
                    <button
                        type="button"
                        style={styles.arButton}
                        onClick={() => setIsARPreviewOpen(true)}
                    >
                        View in AR
                    </button>
                    <div style={styles.viewOnlyBadge}>View only</div>
                </div>
            </header>
            <div style={styles.layout}>
                <div style={styles.canvasShell}>
                    {!isARPreviewOpen && <StandCanvas />}
                </div>
                {!isARPreviewOpen && (
                    <ReviewSidebar
                        {...(shareToken ? { shareToken } : {})}
                        {...(portalProjectId ? { projectId: portalProjectId } : {})}
                        {...(customerId ? { customerId } : {})}
                        {...(permissions ? { permissions } : {})}
                    />
                )}
            </div>
            {isARPreviewOpen && (
                <ARScene
                    onExit={() => {
                        exitAR();
                        setIsARPreviewOpen(false);
                    }}
                />
            )}
        </div>
    );
}

const styles = {
    page: {
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
        background: "#171a20"
    },
    layout: {
        display: "flex",
        width: "100%",
        height: "100%"
    },
    canvasShell: {
        flex: 1,
        minWidth: 0,
        height: "100%"
    },
    header: {
        position: "absolute",
        top: 20,
        left: 20,
        right: 360,
        zIndex: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        padding: "12px 16px",
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "rgba(32, 36, 43, 0.92)",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        pointerEvents: "none"
    },
    headerActions: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        pointerEvents: "auto"
    },
    arButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    headerLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: "#f7f7f2"
    },
    viewOnlyBadge: {
        fontSize: 12,
        fontWeight: 600,
        color: "#cbd5e1",
        border: "1px solid #4b5562",
        borderRadius: 999,
        padding: "6px 10px",
        background: "#2d3440"
    },
    message: {
        display: "grid",
        placeItems: "center",
        width: "100%",
        height: "100%",
        color: "#d1d5db",
        fontSize: 15
    },
    errorPanel: {
        display: "grid",
        placeContent: "center",
        width: "100%",
        height: "100%",
        padding: 24
    },
    errorTitle: {
        margin: 0,
        color: "#f7f7f2",
        fontSize: 24
    },
    errorText: {
        marginTop: 12,
        color: "#c5cad3",
        fontSize: 14,
        maxWidth: 420
    }
} satisfies Record<string, import("react").CSSProperties>;
