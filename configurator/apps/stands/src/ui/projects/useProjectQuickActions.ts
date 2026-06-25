import { useCallback, useEffect, useState } from "react";
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
import { captureStandSceneViews } from "../../scene/sceneCaptureRegistry";
import { useSettings } from "../settings";
import { usePermissions } from "../auth";
import { useCloudSession } from "../cloud";
import { useProjectSession } from "./projectSession";

export function useProjectQuickActions() {
    const { saveActiveProject, isBusy } = useProjectSession();
    const { settings, materialCatalog } = useSettings();
    const { user } = useCloudSession();
    const { isGuestMode } = usePermissions();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleShare = useCallback(async () => {
        setStatusMessage(null);

        try {
            const document = await saveActiveProject();
            const shared = await shareService.createShareLink(document, {
                shareKind: isGuestMode ? "guest_handoff" : "customer_review"
            });
            const shareUrl = buildShareUrl(shared.shareToken);

            if (!isGuestMode) {
                await reviewService.sendForReview(
                    document.id,
                    shared.shareToken,
                    user?.id ?? null
                );
            }

            await navigator.clipboard.writeText(shareUrl);
            setStatusMessage(isGuestMode ? "Design link copied for your supplier" : "Share link copied");
        } catch (error) {
            console.warn("Share link creation failed.", error);
            setStatusMessage("Share failed");
        }
    }, [isGuestMode, saveActiveProject, user?.id]);

    const handleExportQuotePdf = useCallback(async () => {
        setStatusMessage(null);

        if (!settings || !materialCatalog) {
            setStatusMessage("Settings not loaded");
            return;
        }

        try {
            await loadingStateService.run("export", async () => {
                const startedAt = performance.now();
                const document = await saveActiveProject();
                const sceneViews = await captureStandSceneViews();
                const quoteInput = sceneViews
                    ? { previewImages: [sceneViews.front, sceneViews.top] as string[] }
                    : {};
                const quote = generateOrganizationQuote(
                    document,
                    settings,
                    materialCatalog,
                    quoteInput
                );

                // Critical path: produce and download the PDF first so a failing
                // analytics/audit/logging side-effect can never block the export.
                await downloadOrganizationQuotePDF(
                    document,
                    settings,
                    materialCatalog,
                    quoteInput,
                    {
                    fileName: `${document.name.replace(/[^\w\-]+/g, "-").toLowerCase()}-quote.pdf`
                });

                // Best-effort telemetry — never fail the export because of these.
                try {
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
                } catch (telemetryError) {
                    console.warn("Quote analytics tracking failed (non-fatal).", telemetryError);
                }

                try {
                    performanceService.recordExportDuration(
                        "export.quotePdf",
                        Math.round(performance.now() - startedAt),
                        { projectId: document.id }
                    );
                } catch (perfError) {
                    console.warn("Quote performance logging failed (non-fatal).", perfError);
                }

                try {
                    await auditService.record({
                        action: "quote.exported",
                        entityType: "quote",
                        entityId: document.id
                    });
                } catch (auditError) {
                    console.warn("Quote audit logging failed (non-fatal).", auditError);
                }
            });
            setStatusMessage("Quote PDF exported");
        } catch (error) {
            errorTrackingService.captureError(error, { context: "export.quotePdf" });
            console.error("Quote export failed.", error);
            const detail = error instanceof Error ? error.message : "";
            setStatusMessage(detail ? `Quote export failed: ${detail}` : "Quote export failed");
        }
    }, [materialCatalog, saveActiveProject, settings]);

    const handleExportManufacturingPdf = useCallback(async () => {
        setStatusMessage(null);

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
            });
            setStatusMessage("Manufacturing PDF exported");
        } catch (error) {
            errorTrackingService.captureError(error, { context: "export.manufacturingPdf" });
            setStatusMessage("Manufacturing export failed");
        }
    }, [materialCatalog, saveActiveProject]);

    const handleExportManufacturingJson = useCallback(async () => {
        setStatusMessage(null);

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
            });
            setStatusMessage("Manufacturing JSON exported");
        } catch (error) {
            errorTrackingService.captureError(error, { context: "export.manufacturingJson" });
            setStatusMessage("Manufacturing export failed");
        }
    }, [materialCatalog, saveActiveProject]);

    useEffect(() => {
        if (!statusMessage) {
            return;
        }

        const timeout = window.setTimeout(() => setStatusMessage(null), 2800);

        return () => {
            window.clearTimeout(timeout);
        };
    }, [statusMessage]);

    return {
        isBusy,
        statusMessage,
        handleShare,
        handleExportQuotePdf,
        handleExportManufacturingPdf,
        handleExportManufacturingJson
    };
}
