import { useEffect, useState, type ChangeEvent } from "react";
import { assetService } from "../../services/assets/AssetService";
import type {
    CatalogFabricItem,
    CatalogFrameOption,
    CompanySettings
} from "../../services/settings";
import { useSettings } from "./SettingsProvider";
import { ErpSettingsTab } from "./ErpSettingsTab";
import { ActivityLogTab } from "./ActivityLogTab";
import { CustomersAdminTab } from "./CustomersAdminTab";
import { DashboardTab } from "./DashboardTab";

export type AdminTab =
    | "dashboard"
    | "company"
    | "materials"
    | "pricing"
    | "erp"
    | "activity"
    | "components"
    | "customers";

interface AdminPanelProps {
    isOpen: boolean;
    onClose: () => void;
    initialTab?: AdminTab;
}

export function AdminPanel({ isOpen, onClose, initialTab }: AdminPanelProps) {
    const {
        settings,
        materialCatalog,
        isLoading,
        isSaving,
        error,
        saveCompanySettings,
        saveMaterialCatalog
    } = useSettings();
    const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
    const [companyDraft, setCompanyDraft] = useState<CompanySettings | null>(null);
    const [fabricsDraft, setFabricsDraft] = useState<CatalogFabricItem[]>([]);
    const [framesDraft, setFramesDraft] = useState<CatalogFrameOption[]>([]);
    const [currency, setCurrency] = useState("EUR");
    const [taxRate, setTaxRate] = useState("0.21");
    const [terms, setTerms] = useState("");

    useEffect(() => {
        if (isOpen && initialTab) {
            setActiveTab(initialTab === "components" ? "dashboard" : initialTab);
        }
    }, [initialTab, isOpen]);

    useEffect(() => {
        if (!settings || !materialCatalog) {
            return;
        }

        setCompanyDraft(settings);
        setFabricsDraft(materialCatalog.fabrics);
        setFramesDraft(materialCatalog.frameOptions);
        setCurrency(settings.quoteDefaults.currency);
        setTaxRate(String(settings.quoteDefaults.taxRate));
        setTerms(settings.quoteDefaults.terms);
    }, [materialCatalog, settings]);

    if (!isOpen) {
        return null;
    }

    const handleCompanySave = async () => {
        if (!companyDraft) {
            return;
        }

        await saveCompanySettings({
            companyName: companyDraft.companyName,
            logoAssetId: companyDraft.logoAssetId,
            address: companyDraft.address,
            email: companyDraft.email,
            phone: companyDraft.phone,
            manufacturingDefaults: companyDraft.manufacturingDefaults
        });
    };

    const handleMaterialsSave = async () => {
        await saveMaterialCatalog({
            fabrics: fabricsDraft,
            frameOptions: framesDraft
        });
    };

    const handlePricingSave = async () => {
        const parsedTaxRate = Number(taxRate);

        await saveCompanySettings({
            quoteDefaults: {
                currency: currency.trim() || "EUR",
                taxRate: Number.isFinite(parsedTaxRate) ? parsedTaxRate : 0,
                terms
            }
        });
    };

    const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (!file || !companyDraft) {
            return;
        }

        const asset = await assetService.upload(file, {
            width: 512,
            height: 512,
            dpi: 300
        });

        setCompanyDraft({
            ...companyDraft,
            logoAssetId: asset.id
        });
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div
                style={styles.modal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-panel-title"
            >
                <div style={styles.header}>
                    <div>
                        <h2 id="admin-panel-title" style={styles.title}>Admin Settings</h2>
                        <p style={styles.subtitle}>Organization-level company, materials, and pricing defaults.</p>
                    </div>
                    <button type="button" style={styles.iconButton} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div style={styles.tabs}>
                    {(["dashboard", "company", "materials", "pricing", "erp", "activity", "customers"] as AdminTab[]).map(tab => (
                        <button
                            key={tab}
                            type="button"
                            style={{
                                ...styles.tab,
                                ...(activeTab === tab ? styles.tabActive : undefined)
                            }}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === "dashboard"
                                ? "Dashboard"
                                : tab === "company"
                                ? "Company"
                                : tab === "materials"
                                    ? "Materials"
                                    : tab === "pricing"
                                        ? "Pricing defaults"
                                        : tab === "erp"
                                            ? "ERP Settings"
                                            : tab === "activity"
                                                ? "Activity Log"
                                                : "Customers"}
                        </button>
                    ))}
                </div>

                {activeTab === "dashboard" && <DashboardTab />}

                {(activeTab === "company" || activeTab === "materials" || activeTab === "pricing")
                    && (isLoading || !companyDraft) ? (
                    <p style={styles.empty}>Loading settings…</p>
                ) : activeTab === "company" && companyDraft ? (
                    <div style={styles.form}>
                        <label style={styles.field}>
                            <span style={styles.label}>Company name</span>
                            <input
                                style={styles.input}
                                value={companyDraft.companyName}
                                onChange={event => setCompanyDraft({
                                    ...companyDraft,
                                    companyName: event.target.value
                                })}
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Address</span>
                            <textarea
                                style={styles.textarea}
                                rows={3}
                                value={companyDraft.address}
                                onChange={event => setCompanyDraft({
                                    ...companyDraft,
                                    address: event.target.value
                                })}
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Email</span>
                            <input
                                style={styles.input}
                                value={companyDraft.email}
                                onChange={event => setCompanyDraft({
                                    ...companyDraft,
                                    email: event.target.value
                                })}
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Phone</span>
                            <input
                                style={styles.input}
                                value={companyDraft.phone}
                                onChange={event => setCompanyDraft({
                                    ...companyDraft,
                                    phone: event.target.value
                                })}
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Company logo</span>
                            <input type="file" accept="image/*" onChange={event => void handleLogoUpload(event)} />
                            {companyDraft.logoAssetId && (
                                <span style={styles.hint}>Logo asset: {companyDraft.logoAssetId}</span>
                            )}
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Manufacturing notes</span>
                            <textarea
                                style={styles.textarea}
                                rows={3}
                                value={companyDraft.manufacturingDefaults.notes}
                                onChange={event => setCompanyDraft({
                                    ...companyDraft,
                                    manufacturingDefaults: {
                                        ...companyDraft.manufacturingDefaults,
                                        notes: event.target.value
                                    }
                                })}
                            />
                        </label>
                        <button
                            type="button"
                            style={styles.buttonPrimary}
                            disabled={isSaving}
                            onClick={() => void handleCompanySave()}
                        >
                            Save company
                        </button>
                    </div>
                ) : activeTab === "materials" ? (
                    <div style={styles.form}>
                        <h3 style={styles.sectionTitle}>Fabrics</h3>
                        {fabricsDraft.map((fabric, index) => (
                            <div key={fabric.id} style={styles.row}>
                                <input
                                    style={styles.input}
                                    value={fabric.name}
                                    onChange={event => {
                                        const next = [...fabricsDraft];
                                        next[index] = { ...fabric, name: event.target.value };
                                        setFabricsDraft(next);
                                    }}
                                />
                                <input
                                    style={styles.inputSmall}
                                    type="number"
                                    value={fabric.pricePerUnit ?? 0}
                                    onChange={event => {
                                        const next = [...fabricsDraft];
                                        next[index] = {
                                            ...fabric,
                                            pricePerUnit: Number(event.target.value)
                                        };
                                        setFabricsDraft(next);
                                    }}
                                />
                            </div>
                        ))}

                        <h3 style={styles.sectionTitle}>Frame options</h3>
                        {framesDraft.map((frame, index) => (
                            <div key={frame.id} style={styles.row}>
                                <input
                                    style={styles.input}
                                    value={frame.name}
                                    onChange={event => {
                                        const next = [...framesDraft];
                                        next[index] = { ...frame, name: event.target.value };
                                        setFramesDraft(next);
                                    }}
                                />
                                <input
                                    style={styles.inputSmall}
                                    type="number"
                                    value={frame.price ?? 0}
                                    onChange={event => {
                                        const next = [...framesDraft];
                                        next[index] = {
                                            ...frame,
                                            price: Number(event.target.value)
                                        };
                                        setFramesDraft(next);
                                    }}
                                />
                            </div>
                        ))}

                        <button
                            type="button"
                            style={styles.buttonPrimary}
                            disabled={isSaving}
                            onClick={() => void handleMaterialsSave()}
                        >
                            Save materials
                        </button>
                    </div>
                ) : activeTab === "pricing" ? (
                    <div style={styles.form}>
                        <label style={styles.field}>
                            <span style={styles.label}>Currency</span>
                            <input
                                style={styles.input}
                                value={currency}
                                onChange={event => setCurrency(event.target.value.toUpperCase())}
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Tax rate (decimal)</span>
                            <input
                                style={styles.input}
                                value={taxRate}
                                onChange={event => setTaxRate(event.target.value)}
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Quote terms</span>
                            <textarea
                                style={styles.textarea}
                                rows={6}
                                value={terms}
                                onChange={event => setTerms(event.target.value)}
                            />
                        </label>
                        <button
                            type="button"
                            style={styles.buttonPrimary}
                            disabled={isSaving}
                            onClick={() => void handlePricingSave()}
                        >
                            Save pricing defaults
                        </button>
                    </div>
                ) : null}

                {activeTab === "erp" && <ErpSettingsTab />}

                {activeTab === "activity" && <ActivityLogTab />}

                {activeTab === "customers" && <CustomersAdminTab />}

                {error && <p style={styles.error}>{error}</p>}
            </div>
        </div>
    );
}

const styles = {
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(10, 12, 16, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 45,
        padding: 20,
        boxSizing: "border-box"
    },
    modal: {
        width: "min(760px, 100%)",
        maxHeight: "min(85vh, 900px)",
        overflow: "auto",
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 10,
        padding: 20,
        display: "grid",
        gap: 16,
        fontFamily: "system-ui, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12
    },
    title: {
        margin: 0,
        fontSize: 20
    },
    subtitle: {
        margin: "6px 0 0",
        color: "#9aa3b2",
        fontSize: 13
    },
    iconButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        width: 32,
        height: 32,
        cursor: "pointer",
        fontSize: 20
    },
    tabs: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap"
    },
    tab: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#cbd5e1",
        borderRadius: 999,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    tabActive: {
        background: "#3a4558",
        color: "#ffffff",
        borderColor: "#8ea0b8"
    },
    form: {
        display: "grid",
        gap: 12
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
        boxSizing: "border-box"
    },
    inputSmall: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13,
        width: 100,
        boxSizing: "border-box"
    },
    textarea: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13,
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical"
    },
    row: {
        display: "grid",
        gridTemplateColumns: "1fr 120px",
        gap: 8
    },
    sectionTitle: {
        margin: "8px 0 0",
        fontSize: 14
    },
    buttonPrimary: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        justifySelf: "start"
    },
    hint: {
        fontSize: 11,
        color: "#9aa3b2"
    },
    empty: {
        margin: 0,
        color: "#9aa3b2"
    },
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 12
    }
} satisfies Record<string, import("react").CSSProperties>;
