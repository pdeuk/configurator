import { useEffect, useState } from "react";
import {
    ERP_PROVIDERS,
    erpService,
    formatERPProvider,
    type ERPConnection,
    type ERPConnectionTestResult,
    type ERPExportReference,
    type ERPExportResult
} from "../../services/erp";
import { applyMaterialCatalogToManufacturingPackage, generateOrganizationQuote } from "../../services/settings";
import { generateManufacturingPackage } from "../../services/manufacturing";
import {
    auditService,
    errorTrackingService,
    loadingStateService,
    performanceService
} from "../../services/system";
import { trackEvent } from "../../services/analytics";
import { AsyncErrorTrigger, ErpErrorBoundary } from "../system";
import { useProjectSession } from "../projects/projectSession";
import { useSettings } from "./SettingsProvider";

export function ErpSettingsTab() {
    const { saveActiveProject } = useProjectSession();
    const { settings, materialCatalog } = useSettings();
    const [connection, setConnection] = useState<ERPConnection | null>(null);
    const [references, setReferences] = useState<ERPExportReference[]>([]);
    const [testResult, setTestResult] = useState<ERPConnectionTestResult | null>(null);
    const [exportMessage, setExportMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [erpBoundaryError, setErpBoundaryError] = useState<Error | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const loadState = async () => {
        setError(null);

        try {
            const [nextConnection, nextReferences] = await Promise.all([
                erpService.getConnection(),
                erpService.listExportReferences()
            ]);
            setConnection(nextConnection);
            setReferences(nextReferences.slice(0, 5));
        } catch (loadError) {
            errorTrackingService.captureError(loadError, {
                context: "erp.settings.load"
            });
            console.warn("ERP settings load failed.", loadError);
            setError("Unable to load ERP settings.");
        }
    };

    useEffect(() => {
        void loadState();
    }, []);

    const handleSaveConnection = async () => {
        if (!connection) {
            return;
        }

        setIsBusy(true);
        setError(null);

        try {
            const next = await erpService.updateConnection({
                provider: connection.provider,
                enabled: connection.enabled,
                settings: connection.settings
            });
            setConnection(next);
            setExportMessage("ERP settings saved.");
        } catch (saveError) {
            console.warn("ERP settings save failed.", saveError);
            setError("Unable to save ERP settings.");
        } finally {
            setIsBusy(false);
        }
    };

    const handleTestConnection = async () => {
        setIsBusy(true);
        setError(null);
        setTestResult(null);

        try {
            const result = await erpService.testConnection();
            setTestResult(result);
        } catch (testError) {
            console.warn("ERP connection test failed.", testError);
            setError("Connection test failed.");
        } finally {
            setIsBusy(false);
        }
    };

    const reportExportResult = async (
        label: string,
        result: ERPExportResult,
        entityId: string
    ) => {
        if (result.success) {
            await auditService.record({
                action: "erp.exported",
                entityType: "erp",
                entityId: result.externalId ?? entityId
            });
            setExportMessage(`${label} exported (${result.externalId ?? "no id"})`);
            await loadState();
            return;
        }

        const failureMessage = result.errors.join(" ") || `${label} export failed.`;
        setError(failureMessage);
        setErpBoundaryError(new Error(failureMessage));
    };

    const handleExportProject = async () => {
        setIsBusy(true);
        setError(null);
        setErpBoundaryError(null);

        try {
            await loadingStateService.run("export", async () => {
                const startedAt = performance.now();
                const project = await saveActiveProject();
                const result = await erpService.exportProjectToERP(project);

                performanceService.recordExportDuration(
                    "export.erp",
                    Math.round(performance.now() - startedAt),
                    { projectId: project.id, exportType: "project" }
                );

                await reportExportResult("Project", result, project.id);
            });
        } catch (exportError) {
            errorTrackingService.captureError(exportError, {
                context: "erp.export.project"
            });
            console.warn("ERP project export failed.", exportError);
            setError("Project export failed.");
            setErpBoundaryError(
                exportError instanceof Error ? exportError : new Error("Project export failed.")
            );
        } finally {
            setIsBusy(false);
        }
    };

    const handleExportQuote = async () => {
        if (!settings || !materialCatalog) {
            setError("Organization settings are not loaded.");
            return;
        }

        setIsBusy(true);
        setError(null);
        setErpBoundaryError(null);

        try {
            await loadingStateService.run("export", async () => {
                const startedAt = performance.now();
                const project = await saveActiveProject();
                const quote = generateOrganizationQuote(project, settings, materialCatalog);

                await trackEvent({
                    event: "quote.created",
                    entityType: "quote",
                    entityId: quote.id,
                    metadata: {
                        projectId: project.id,
                        total: quote.pricing.total,
                        currency: settings.quoteDefaults.currency
                    }
                });

                const result = await erpService.exportQuoteToERP(quote);

                performanceService.recordExportDuration(
                    "export.erp",
                    Math.round(performance.now() - startedAt),
                    { projectId: project.id, exportType: "quote" }
                );

                if (result.success) {
                    await trackEvent({
                        event: "quote.exported",
                        entityType: "quote",
                        entityId: quote.id,
                        metadata: {
                            projectId: project.id,
                            total: quote.pricing.total,
                            currency: settings.quoteDefaults.currency,
                            destination: "erp"
                        }
                    });
                }

                await reportExportResult("Quote", result, quote.id);
            });
        } catch (exportError) {
            errorTrackingService.captureError(exportError, {
                context: "erp.export.quote"
            });
            console.warn("ERP quote export failed.", exportError);
            setError("Quote export failed.");
            setErpBoundaryError(
                exportError instanceof Error ? exportError : new Error("Quote export failed.")
            );
        } finally {
            setIsBusy(false);
        }
    };

    const handleExportManufacturing = async () => {
        setIsBusy(true);
        setError(null);
        setErpBoundaryError(null);

        try {
            await loadingStateService.run("export", async () => {
                const startedAt = performance.now();
                const project = await saveActiveProject();
                let manufacturingPackage = generateManufacturingPackage(project);

                if (materialCatalog) {
                    manufacturingPackage = applyMaterialCatalogToManufacturingPackage(
                        manufacturingPackage,
                        materialCatalog
                    );
                }

                const result = await erpService.exportManufacturingToERP(manufacturingPackage);

                performanceService.recordExportDuration(
                    "export.erp",
                    Math.round(performance.now() - startedAt),
                    { projectId: project.id, exportType: "manufacturing" }
                );

                if (result.success) {
                    await trackEvent({
                        event: "manufacturing.exported",
                        entityType: "manufacturing",
                        entityId: manufacturingPackage.id,
                        metadata: {
                            projectId: project.id,
                            destination: "erp"
                        }
                    });
                }

                await reportExportResult(
                    "Manufacturing package",
                    result,
                    manufacturingPackage.id
                );
            });
        } catch (exportError) {
            errorTrackingService.captureError(exportError, {
                context: "erp.export.manufacturing"
            });
            console.warn("ERP manufacturing export failed.", exportError);
            setError("Manufacturing export failed.");
            setErpBoundaryError(
                exportError instanceof Error
                    ? exportError
                    : new Error("Manufacturing export failed.")
            );
        } finally {
            setIsBusy(false);
        }
    };

    if (!connection) {
        return <p style={styles.empty}>Loading ERP settings…</p>;
    }

    return (
        <ErpErrorBoundary
            resetKeys={[erpBoundaryError?.message ?? null]}
            onReset={() => setErpBoundaryError(null)}
        >
            <AsyncErrorTrigger error={erpBoundaryError} />
            <div style={styles.form}>
            <div style={styles.statusCard}>
                <div style={styles.statusLabel}>Connection status</div>
                <div style={styles.statusValue}>
                    {connection.enabled ? "Enabled" : "Disabled"} · {formatERPProvider(connection.provider)}
                </div>
                {testResult && (
                    <div style={{
                        ...styles.testResult,
                        color: testResult.connected ? "#86efac" : "#fca5a5"
                    }}>
                        {testResult.message}
                    </div>
                )}
            </div>

            <label style={styles.field}>
                <span style={styles.label}>Provider</span>
                <select
                    style={styles.input}
                    value={connection.provider}
                    onChange={event =>
                        setConnection(current =>
                            current
                                ? { ...current, provider: event.target.value as ERPConnection["provider"] }
                                : current
                        )
                    }
                >
                    {ERP_PROVIDERS.map(provider => (
                        <option key={provider} value={provider}>
                            {formatERPProvider(provider)}
                        </option>
                    ))}
                </select>
            </label>

            <label style={styles.checkboxRow}>
                <input
                    type="checkbox"
                    checked={connection.enabled}
                    onChange={event =>
                        setConnection(current =>
                            current ? { ...current, enabled: event.target.checked } : current
                        )
                    }
                />
                <span>Enable ERP connection</span>
            </label>

            <label style={styles.field}>
                <span style={styles.label}>Base URL (reserved)</span>
                <input
                    style={styles.input}
                    value={connection.settings.baseUrl ?? ""}
                    placeholder="https://erp.example.com/api"
                    onChange={event =>
                        setConnection(current =>
                            current
                                ? {
                                    ...current,
                                    settings: {
                                        ...current.settings,
                                        baseUrl: event.target.value
                                    }
                                }
                                : current
                        )
                    }
                />
            </label>

            <div style={styles.actionsRow}>
                <button
                    type="button"
                    style={styles.buttonPrimary}
                    disabled={isBusy}
                    onClick={() => void handleSaveConnection()}
                >
                    Save ERP settings
                </button>
                <button
                    type="button"
                    style={styles.button}
                    disabled={isBusy}
                    onClick={() => void handleTestConnection()}
                >
                    Test connection
                </button>
            </div>

            <div style={styles.section}>
                <h3 style={styles.sectionTitle}>Export to ERP</h3>
                <p style={styles.hint}>
                    Exports use the active project. Mock adapter validates payloads and logs to the console.
                </p>
                <div style={styles.actionsRow}>
                    <button
                        type="button"
                        style={styles.button}
                        disabled={isBusy}
                        onClick={() => void handleExportProject()}
                    >
                        Export project
                    </button>
                    <button
                        type="button"
                        style={styles.button}
                        disabled={isBusy}
                        onClick={() => void handleExportQuote()}
                    >
                        Export quote
                    </button>
                    <button
                        type="button"
                        style={styles.button}
                        disabled={isBusy}
                        onClick={() => void handleExportManufacturing()}
                    >
                        Export manufacturing
                    </button>
                </div>
            </div>

            {references.length > 0 && (
                <div style={styles.section}>
                    <h3 style={styles.sectionTitle}>Recent ERP exports</h3>
                    <div style={styles.referenceList}>
                        {references.map(reference => (
                            <div key={reference.id} style={styles.referenceItem}>
                                <div>{reference.sourceType} · {reference.externalId ?? "—"}</div>
                                <div style={styles.referenceMeta}>
                                    {formatERPProvider(reference.provider)} · {new Date(reference.exportedAt).toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {exportMessage && <p style={styles.message}>{exportMessage}</p>}
            {error && <p style={styles.error}>{error}</p>}
            </div>
        </ErpErrorBoundary>
    );
}

const styles = {
    form: {
        display: "grid",
        gap: 12
    },
    statusCard: {
        padding: 12,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#252932",
        display: "grid",
        gap: 6
    },
    statusLabel: {
        fontSize: 11,
        color: "#9aa3b2",
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em"
    },
    statusValue: {
        fontSize: 14,
        fontWeight: 600
    },
    testResult: {
        fontSize: 12
    },
    field: {
        display: "grid",
        gap: 6
    },
    label: {
        fontSize: 11,
        color: "#9aa3b2"
    },
    input: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13,
        width: "100%",
        boxSizing: "border-box" as const
    },
    checkboxRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 13
    },
    actionsRow: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap" as const
    },
    section: {
        display: "grid",
        gap: 8,
        paddingTop: 8,
        borderTop: "1px solid #3b414a"
    },
    sectionTitle: {
        margin: 0,
        fontSize: 14
    },
    hint: {
        margin: 0,
        fontSize: 12,
        color: "#9aa3b2"
    },
    referenceList: {
        display: "grid",
        gap: 8
    },
    referenceItem: {
        padding: 10,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#171b21",
        fontSize: 13
    },
    referenceMeta: {
        marginTop: 4,
        fontSize: 11,
        color: "#9aa3b2"
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    buttonPrimary: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    empty: {
        margin: 0,
        color: "#9aa3b2"
    },
    message: {
        margin: 0,
        color: "#cbd5e1",
        fontSize: 12
    },
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 12
    }
};
