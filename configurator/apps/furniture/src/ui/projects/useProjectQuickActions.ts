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
import { downloadAllProjectArtwork } from "../../services/artwork/projectArtworkDownload";
import { useSettings } from "../settings";
import { useCloudSession } from "../cloud";
import { useProjectSession } from "./projectSession";

export function useProjectQuickActions() {
    const { saveActiveProject, isBusy } = useProjectSession();
    const { settings, materialCatalog } = useSettings();
    const { user } = useCloudSession();
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const handleShare = useCallback(async () => {
        setStatusMessage(null);

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
            setStatusMessage("Share link copied");
        } catch (error) {
            console.warn("Share link creation failed.", error);
            setStatusMessage("Share failed");
        }
    }, [saveActiveProject, user?.id]);

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
            });
            setStatusMessage("Quote PDF exported");
        } catch (error) {
            errorTrackingService.captureError(error, { context: "export.quotePdf" });
            setStatusMessage("Quote export failed");
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

    const handleDownloadOriginalArtwork = useCallback(async () => {
        setStatusMessage(null);

        try {
            await loadingStateService.run("export", async () => {
                const document = await saveActiveProject();

                if (document.artworkAssets.length === 0) {
                    setStatusMessage("No uploaded artwork in this project");
                    return;
                }

                const result = await downloadAllProjectArtwork(document);

                if (result.failed.length > 0) {
                    setStatusMessage(
                        `Downloaded ${result.downloaded} file(s); ${result.failed.length} unavailable`
                    );
                    return;
                }

                setStatusMessage(
                    result.downloaded === 1
                        ? "Original artwork downloaded"
                        : `Downloaded ${result.downloaded} original artwork files`
                );
            });
        } catch (error) {
            errorTrackingService.captureError(error, { context: "export.artworkOriginal" });
            console.error("Artwork download failed.", error);
            const detail = error instanceof Error ? error.message : "";
            setStatusMessage(detail ? `Artwork download failed: ${detail}` : "Artwork download failed");
        }
    }, [saveActiveProject]);

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
        handleExportManufacturingJson,
        handleDownloadOriginalArtwork
    };
}
