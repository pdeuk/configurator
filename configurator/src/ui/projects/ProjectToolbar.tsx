import { useEffect, useRef, useState } from "react";
import { formatCloudSyncStatus } from "../../services/cloud";
import {
    generateManufacturingPackage,
    manufacturingService
} from "../../services/manufacturing";
import { reviewService } from "../../services/reviews";
import { buildShareUrl, shareService } from "../../services/sharing";
import {
    applyMaterialCatalogToManufacturingPackage,
    downloadOrganizationQuotePDF,
    generateOrganizationQuote
} from "../../services/settings";
import {
    auditService,
    errorTrackingService,
    loadingStateService,
    performanceService
} from "../../services/system";
import { trackEvent } from "../../services/analytics";
import { AsyncErrorTrigger, PdfExportErrorBoundary } from "../system";
import { useSettings } from "../settings";
import { PermissionGuard, usePermissions } from "../auth";
import { AuthPanel, useCloudSession } from "../cloud";
import { useARPreview } from "../ar";
import { useAppShell } from "../shell";
import { useProjectSession } from "./projectSession";

export function ProjectToolbar() {
    const {
        activeProjectName,
        isBusy,
        openManager,
        openTemplateGallery,
        saveActiveProject,
        saveRevision,
        refreshProjects
    } = useProjectSession();
    const {
        isConfigured,
        user,
        syncStatus,
        importLocalProjects
    } = useCloudSession();
    const { settings, materialCatalog } = useSettings();
    const { canManageUsers } = usePermissions();
    const { openARPreview } = useARPreview();
    const {
        openAdmin,
        openAssignCustomer,
        openUsers,
        toggleReviews
    } = useAppShell();
    const [menuOpen, setMenuOpen] = useState(false);
    const [cloudMenuOpen, setCloudMenuOpen] = useState(false);
    const [shareMessage, setShareMessage] = useState<string | null>(null);
    const [revisionMessage, setRevisionMessage] = useState<string | null>(null);
    const [manufacturingMessage, setManufacturingMessage] = useState<string | null>(null);
    const [quoteMessage, setQuoteMessage] = useState<string | null>(null);
    const [exportBoundaryError, setExportBoundaryError] = useState<Error | null>(null);
    const [cloudMessage, setCloudMessage] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const cloudContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        void refreshProjects();
    }, [refreshProjects]);

    useEffect(() => {
        if (!menuOpen && !cloudMenuOpen) {
            return;
        }

        const handlePointerDown = (event: MouseEvent) => {
            const target = event.target as Node;

            if (containerRef.current?.contains(target)) {
                return;
            }

            if (cloudContainerRef.current?.contains(target)) {
                return;
            }

            setMenuOpen(false);
            setCloudMenuOpen(false);
        };

        window.addEventListener("mousedown", handlePointerDown);

        return () => {
            window.removeEventListener("mousedown", handlePointerDown);
        };
    }, [cloudMenuOpen, menuOpen]);

    const handleShare = async () => {
        setShareMessage(null);

        try {
            const document = await saveActiveProject();
            const shared = await shareService.createShareLink(document);
            const shareUrl = buildShareUrl(shared.shareToken);

            await reviewService.sendForReview(
                document.id,
                shared.shareToken,
                user?.id ?? null
            );

            await navigator.clipboard.writeText(shareUrl);
            setShareMessage("Link copied");
        } catch (error) {
            console.warn("Share link creation failed.", error);
            setShareMessage("Share failed");
        }
    };

    const handleExportManufacturingPdf = async () => {
        setManufacturingMessage(null);
        setExportBoundaryError(null);

        try {
            await loadingStateService.run("export", async () => {
                const startedAt = performance.now();
                const document = await saveActiveProject();
                let manufacturingPackage = generateManufacturingPackage(document);

                if (materialCatalog) {
                    manufacturingPackage = applyMaterialCatalogToManufacturingPackage(
                        manufacturingPackage,
                        materialCatalog
                    );
                }

                await manufacturingService.downloadManufacturingPDF(manufacturingPackage, {
                    projectName: document.name
                });

                performanceService.recordExportDuration(
                    "export.manufacturingPdf",
                    Math.round(performance.now() - startedAt),
                    { projectId: document.id }
                );

                await auditService.record({
                    action: "manufacturing.exported",
                    entityType: "manufacturing",
                    entityId: manufacturingPackage.id
                });
                await trackEvent({
                    event: "manufacturing.exported",
                    entityType: "manufacturing",
                    entityId: manufacturingPackage.id,
                    metadata: {
                        projectId: document.id,
                        format: "pdf"
                    }
                });
            });
            setManufacturingMessage("Mfg PDF exported");
        } catch (error) {
            errorTrackingService.captureError(error, {
                context: "export.manufacturingPdf"
            });
            console.warn("Manufacturing PDF export failed.", error);
            setManufacturingMessage("Mfg export failed");
            setExportBoundaryError(
                error instanceof Error ? error : new Error("Manufacturing PDF export failed.")
            );
        }
    };

    const handleExportManufacturingJson = async () => {
        setManufacturingMessage(null);
        setExportBoundaryError(null);

        try {
            await loadingStateService.run("export", async () => {
                const startedAt = performance.now();
                const document = await saveActiveProject();
                let manufacturingPackage = generateManufacturingPackage(document);

                if (materialCatalog) {
                    manufacturingPackage = applyMaterialCatalogToManufacturingPackage(
                        manufacturingPackage,
                        materialCatalog
                    );
                }

                manufacturingService.downloadManufacturingJSON(manufacturingPackage, {
                    projectName: document.name
                });

                performanceService.recordExportDuration(
                    "export.manufacturingJson",
                    Math.round(performance.now() - startedAt),
                    { projectId: document.id }
                );

                await auditService.record({
                    action: "manufacturing.exported",
                    entityType: "manufacturing",
                    entityId: manufacturingPackage.id
                });
                await trackEvent({
                    event: "manufacturing.exported",
                    entityType: "manufacturing",
                    entityId: manufacturingPackage.id,
                    metadata: {
                        projectId: document.id,
                        format: "json"
                    }
                });
            });
            setManufacturingMessage("Mfg JSON exported");
        } catch (error) {
            errorTrackingService.captureError(error, {
                context: "export.manufacturingJson"
            });
            console.warn("Manufacturing JSON export failed.", error);
            setManufacturingMessage("Mfg export failed");
            setExportBoundaryError(
                error instanceof Error ? error : new Error("Manufacturing JSON export failed.")
            );
        }
    };

    const handleExportQuotePdf = async () => {
        setQuoteMessage(null);
        setExportBoundaryError(null);

        if (!settings || !materialCatalog) {
            setQuoteMessage("Settings not loaded");
            return;
        }

        try {
            await loadingStateService.run("export", async () => {
                const startedAt = performance.now();
                const document = await saveActiveProject();
                const quote = generateOrganizationQuote(document, settings, materialCatalog);

                await trackEvent({
                    event: "quote.created",
                    entityType: "quote",
                    entityId: quote.id,
                    metadata: {
                        projectId: document.id,
                        total: quote.pricing.total,
                        currency: settings.quoteDefaults.currency
                    }
                });

                await downloadOrganizationQuotePDF(document, settings, materialCatalog, {}, {
                    fileName: `${document.name.replace(/[^\w\-]+/g, "-").toLowerCase()}-quote.pdf`
                });

                performanceService.recordExportDuration(
                    "export.quotePdf",
                    Math.round(performance.now() - startedAt),
                    { projectId: document.id }
                );

                await auditService.record({
                    action: "quote.exported",
                    entityType: "quote",
                    entityId: document.id
                });
                await trackEvent({
                    event: "quote.exported",
                    entityType: "quote",
                    entityId: quote.id,
                    metadata: {
                        projectId: document.id,
                        total: quote.pricing.total,
                        currency: settings.quoteDefaults.currency
                    }
                });
            });
            setQuoteMessage("Quote PDF exported");
        } catch (error) {
            errorTrackingService.captureError(error, {
                context: "export.quotePdf"
            });
            console.warn("Quote PDF export failed.", error);
            setQuoteMessage("Quote export failed");
            setExportBoundaryError(
                error instanceof Error ? error : new Error("Quote PDF export failed.")
            );
        }
    };

    const handleImportToCloud = async () => {
        setCloudMessage(null);

        try {
            const result = await importLocalProjects();
            setCloudMessage(
                `Imported ${result.importedProjects} project(s), ${result.importedAssets} asset(s)`
            );
            await refreshProjects();
        } catch (error) {
            console.warn("Cloud import failed.", error);
            setCloudMessage("Import failed");
        }
    };

    useEffect(() => {
        if (!shareMessage) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setShareMessage(null);
        }, 2500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [shareMessage]);

    useEffect(() => {
        if (!revisionMessage) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setRevisionMessage(null);
        }, 2500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [revisionMessage]);

    useEffect(() => {
        if (!manufacturingMessage) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setManufacturingMessage(null);
        }, 2500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [manufacturingMessage]);

    useEffect(() => {
        if (!quoteMessage) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setQuoteMessage(null);
        }, 2500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [quoteMessage]);

    useEffect(() => {
        if (!cloudMessage) {
            return;
        }

        const timeout = window.setTimeout(() => {
            setCloudMessage(null);
        }, 3500);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [cloudMessage]);

    return (
        <PdfExportErrorBoundary
            resetKeys={[exportBoundaryError?.message ?? null]}
            onReset={() => setExportBoundaryError(null)}
        >
            <AsyncErrorTrigger error={exportBoundaryError} />
            <div style={styles.bar}>
            <div style={styles.group} ref={containerRef}>
                <button
                    type="button"
                    style={styles.projectButton}
                    disabled={isBusy}
                    onClick={() => setMenuOpen(current => !current)}
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                >
                    <span style={styles.projectLabel}>Project</span>
                    <span style={styles.projectName}>{activeProjectName}</span>
                    <span style={styles.chevron}>{menuOpen ? "▴" : "▾"}</span>
                </button>

                {menuOpen && (
                    <div style={styles.menu} role="menu">
                        <PermissionGuard action="projects.edit">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    void saveActiveProject();
                                }}
                            >
                                Save Project
                            </button>
                        </PermissionGuard>
                        <PermissionGuard action="projects.edit">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    void saveRevision().then(revision => {
                                        if (revision) {
                                            setRevisionMessage(`Saved v${revision.versionNumber}`);
                                        }
                                    });
                                }}
                            >
                                Save Revision
                            </button>
                        </PermissionGuard>
                        <PermissionGuard action="manufacturing.export">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    void handleExportManufacturingPdf();
                                }}
                            >
                                Export Manufacturing PDF
                            </button>
                        </PermissionGuard>
                        <PermissionGuard action="manufacturing.export">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    void handleExportManufacturingJson();
                                }}
                            >
                                Export Manufacturing JSON
                            </button>
                        </PermissionGuard>
                        <PermissionGuard action="quotes.export">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    void handleExportQuotePdf();
                                }}
                            >
                                Export Quote PDF
                            </button>
                        </PermissionGuard>
                        <PermissionGuard action="settings.edit">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    openAssignCustomer();
                                }}
                            >
                                Assign Customer…
                            </button>
                        </PermissionGuard>
                        <PermissionGuard action="settings.edit">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    openAdmin("dashboard");
                                }}
                            >
                                Admin Settings…
                            </button>
                        </PermissionGuard>
                        {canManageUsers && (
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    openUsers();
                                }}
                            >
                                User Management…
                            </button>
                        )}
                        <PermissionGuard action="projects.view">
                            <button
                                type="button"
                                style={styles.menuItem}
                                disabled={isBusy}
                                onClick={() => {
                                    setMenuOpen(false);
                                    openManager();
                                }}
                            >
                                Manage Projects…
                            </button>
                        </PermissionGuard>
                    </div>
                )}
            </div>

            <nav style={styles.navGroup} aria-label="Application">
                <PermissionGuard action="projects.view">
                    <button type="button" style={styles.navButton} disabled={isBusy} onClick={openManager}>
                        Projects
                    </button>
                </PermissionGuard>
                <PermissionGuard action="projects.create">
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={openTemplateGallery}
                    >
                        Templates
                    </button>
                </PermissionGuard>
                <PermissionGuard action="projects.edit">
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={() => openAdmin("components")}
                    >
                        Components
                    </button>
                </PermissionGuard>
                <PermissionGuard action="settings.edit">
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={() => openAdmin("customers")}
                    >
                        Customers
                    </button>
                </PermissionGuard>
                <PermissionGuard action="quotes.export">
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={() => void handleExportQuotePdf()}
                    >
                        Quotes
                    </button>
                </PermissionGuard>
                <PermissionGuard action="manufacturing.export">
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={() => void handleExportManufacturingPdf()}
                    >
                        Manufacturing
                    </button>
                </PermissionGuard>
                <PermissionGuard action="projects.edit">
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={toggleReviews}
                    >
                        Reviews
                    </button>
                </PermissionGuard>
                <PermissionGuard action="projects.view">
                    <button type="button" style={styles.navButton} disabled={isBusy} onClick={openARPreview}>
                        AR Preview
                    </button>
                </PermissionGuard>
                <PermissionGuard action="settings.edit">
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={() => openAdmin("dashboard")}
                    >
                        Admin
                    </button>
                </PermissionGuard>
                {canManageUsers && (
                    <button
                        type="button"
                        style={styles.navButton}
                        disabled={isBusy}
                        onClick={openUsers}
                    >
                        Users
                    </button>
                )}
            </nav>

            {isConfigured && (
                <div style={styles.group} ref={cloudContainerRef}>
                    <button
                        type="button"
                        style={styles.cloudButton}
                        disabled={isBusy}
                        onClick={() => setCloudMenuOpen(current => !current)}
                        aria-haspopup="menu"
                        aria-expanded={cloudMenuOpen}
                    >
                        <span style={styles.cloudLabel}>Account</span>
                        <span style={styles.cloudValue}>
                            {user?.email || "Sign in"}
                        </span>
                        <span style={styles.syncBadge} data-status={syncStatus}>
                            {formatCloudSyncStatus(syncStatus)}
                        </span>
                    </button>

                    {cloudMenuOpen && (
                        <div style={styles.cloudMenu}>
                            <AuthPanel onClose={() => setCloudMenuOpen(false)} />
                            {user && (
                                <button
                                    type="button"
                                    style={styles.menuItem}
                                    disabled={isBusy}
                                    onClick={() => {
                                        setCloudMenuOpen(false);
                                        void handleImportToCloud();
                                    }}
                                >
                                    Import to cloud
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            <PermissionGuard action="projects.edit">
                <button
                    type="button"
                    style={styles.shareButton}
                    disabled={isBusy}
                    onClick={() => void handleShare()}
                >
                    Share
                </button>
            </PermissionGuard>

            {shareMessage && (
                <span style={styles.shareMessage}>{shareMessage}</span>
            )}

            {revisionMessage && (
                <span style={styles.shareMessage}>{revisionMessage}</span>
            )}

            {manufacturingMessage && (
                <span style={styles.shareMessage}>{manufacturingMessage}</span>
            )}

            {quoteMessage && (
                <span style={styles.shareMessage}>{quoteMessage}</span>
            )}

            {cloudMessage && (
                <span style={styles.shareMessage}>{cloudMessage}</span>
            )}

            <PermissionGuard action="projects.edit">
                <button
                    type="button"
                    style={styles.revisionButton}
                    disabled={isBusy}
                    onClick={() => {
                        void saveRevision().then(revision => {
                            if (revision) {
                                setRevisionMessage(`Saved v${revision.versionNumber}`);
                            }
                        });
                    }}
                >
                    Save Revision
                </button>
            </PermissionGuard>

            <PermissionGuard action="projects.edit">
                <button
                    type="button"
                    style={styles.saveButton}
                    disabled={isBusy}
                    onClick={() => void saveActiveProject()}
                >
                    Save Project
                </button>
            </PermissionGuard>
            </div>
        </PdfExportErrorBoundary>
    );
}

const styles = {
    bar: {
        position: "absolute",
        top: 40,
        left: 320,
        right: 20,
        zIndex: 12,
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 10,
        pointerEvents: "none"
    },
    navGroup: {
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 6,
        pointerEvents: "auto"
    },
    navButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        whiteSpace: "nowrap"
    },
    group: {
        position: "relative",
        pointerEvents: "auto"
    },
    projectButton: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        minWidth: 240,
        maxWidth: "min(420px, calc(100vw - 520px))",
        border: "1px solid #3b414a",
        background: "#20242b",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)"
    },
    cloudButton: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 220,
        maxWidth: "min(320px, calc(100vw - 720px))",
        border: "1px solid #3b414a",
        background: "#20242b",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)"
    },
    projectLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    cloudLabel: {
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    projectName: {
        flex: 1,
        textAlign: "left",
        fontSize: 14,
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    cloudValue: {
        flex: 1,
        textAlign: "left",
        fontSize: 12,
        fontWeight: 600,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
    },
    syncBadge: {
        fontSize: 10,
        fontWeight: 600,
        color: "#cbd5e1",
        border: "1px solid #4b5562",
        borderRadius: 999,
        padding: "3px 8px",
        whiteSpace: "nowrap"
    },
    chevron: {
        color: "#c5cad3",
        fontSize: 12
    },
    menu: {
        position: "absolute",
        top: "calc(100% + 6px)",
        left: 0,
        minWidth: "100%",
        background: "#20242b",
        border: "1px solid #3b414a",
        borderRadius: 8,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
        overflow: "hidden",
        display: "grid"
    },
    cloudMenu: {
        position: "absolute",
        top: "calc(100% + 6px)",
        right: 0,
        minWidth: 280,
        background: "#20242b",
        border: "1px solid #3b414a",
        borderRadius: 8,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.28)",
        overflow: "hidden"
    },
    menuItem: {
        border: "none",
        background: "transparent",
        color: "#f7f7f2",
        textAlign: "left",
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    saveButton: {
        pointerEvents: "auto",
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)"
    },
    shareButton: {
        pointerEvents: "auto",
        border: "1px solid #4b5562",
        background: "#253040",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)"
    },
    revisionButton: {
        pointerEvents: "auto",
        border: "1px solid #4b5562",
        background: "#2a3340",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)"
    },
    shareMessage: {
        pointerEvents: "none",
        color: "#cbd5e1",
        fontSize: 12,
        background: "rgba(32, 36, 43, 0.92)",
        border: "1px solid #3b414a",
        borderRadius: 999,
        padding: "6px 10px"
    }
} satisfies Record<string, import("react").CSSProperties>;
