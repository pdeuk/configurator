import { useEffect, useState } from "react";
import {
    buildPortalProjectPath,
    customerService,
    type Customer,
    type CustomerProjectSummary
} from "../services/customer";
import {
    formatReviewStatus,
    reviewService
} from "../services/reviews";
import {
    generateOrganizationQuote,
    getMaterialCatalog,
    getSettings,
    setSettingsContext
} from "../services/settings";
import { ProjectService } from "../services/ProjectService";
import { getProjectStorage } from "../services/cloud";
import { CloudSessionProvider, useCloudSession } from "../ui/cloud";
import { SharedProjectViewer } from "./SharedProjectViewer";

interface CustomerPortalProps {
    projectId?: string | null;
}

function CustomerPortalShell({ projectId }: CustomerPortalProps) {
    const { user, isConfigured, login, register, logout, isAuthenticating, authError } =
        useCloudSession();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [projects, setProjects] = useState<CustomerProjectSummary[]>([]);
    const [quoteSummaries, setQuoteSummaries] = useState<Array<{ projectId: string; total: number; currency: string }>>([]);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"projects" | "quotes" | "reviews">("projects");

    const loadCustomerState = async () => {
        setIsLoading(true);
        setError(null);

        try {
            let nextCustomer = await customerService.getAuthenticatedPortalCustomer();

            if (!nextCustomer && user) {
                nextCustomer = await customerService.getPortalCustomerByAuthUser(user.id);

                if (nextCustomer) {
                    customerService.setPortalSession(nextCustomer);
                }
            }

            setCustomer(nextCustomer);

            if (!nextCustomer) {
                setProjects([]);
                setQuoteSummaries([]);
                return;
            }

            setSettingsContext({
                organizationId: nextCustomer.organizationId,
                user: null
            });

            const nextProjects = await customerService.getCustomerProjects(nextCustomer.id);
            setProjects(nextProjects);

            const [settings, catalog] = await Promise.all([
                getSettings(),
                getMaterialCatalog()
            ]);
            const projectService = new ProjectService(getProjectStorage());
            const quotes = await Promise.all(
                nextProjects.map(async (summary: CustomerProjectSummary) => {
                    const project = await projectService.load(summary.projectId);

                    if (!project) {
                        return null;
                    }

                    const quote = generateOrganizationQuote(project, settings, catalog);
                    return {
                        projectId: summary.projectId,
                        total: quote.pricing.total,
                        currency: quote.pricing.currency
                    };
                })
            );
            setQuoteSummaries(quotes.filter((entry): entry is { projectId: string; total: number; currency: string } => entry !== null));

            const withReviewStatus = await Promise.all(
                nextProjects.map(async (summary: CustomerProjectSummary) => {
                    const review = await reviewService.getReviewByProjectId(summary.projectId);
                    return {
                        ...summary,
                        reviewStatus: review ? formatReviewStatus(review.status) : "Not sent"
                    };
                })
            );
            setProjects(withReviewStatus);
        } catch (loadError) {
            console.warn("Customer portal load failed.", loadError);
            setError("Unable to load customer portal.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadCustomerState();
    }, [user]);

    const handleLocalLogin = async () => {
        setError(null);

        try {
            const nextCustomer = await customerService.loginPortal(email, password);
            setCustomer(nextCustomer);
            await loadCustomerState();
        } catch (loginError) {
            console.warn("Customer portal login failed.", loginError);
            setError(loginError instanceof Error ? loginError.message : "Login failed.");
        }
    };

    const handleCloudLogin = async () => {
        setError(null);

        try {
            await login(email, password);
            await loadCustomerState();
        } catch (loginError) {
            console.warn("Customer cloud login failed.", loginError);
            setError("Cloud login failed.");
        }
    };

    const handleCloudRegister = async () => {
        setError(null);

        try {
            await register(email, password);
            await loadCustomerState();
        } catch (registerError) {
            console.warn("Customer cloud register failed.", registerError);
            setError("Registration failed.");
        }
    };

    const handleLogout = async () => {
        customerService.clearPortalSession();
        setCustomer(null);

        if (isConfigured && user) {
            await logout();
        }

        window.location.href = "/portal";
    };

    if (projectId && customer) {
        const access = projects.find(entry => entry.projectId === projectId);

        return (
            <SharedProjectViewer
                portalProjectId={projectId}
                customerId={customer.id}
                {...(access?.permissions ? { permissions: access.permissions } : {})}
            />
        );
    }

    if (isLoading) {
        return (
            <div style={styles.page}>
                <div style={styles.message}>Loading customer portal…</div>
            </div>
        );
    }

    if (!customer) {
        return (
            <div style={styles.page}>
                <div style={styles.loginCard}>
                    <h1 style={styles.title}>Customer Portal</h1>
                    <p style={styles.subtitle}>
                        Sign in to view assigned projects, quotes, and approval status.
                    </p>
                    <label style={styles.field}>
                        <span style={styles.label}>Email</span>
                        <input
                            style={styles.input}
                            value={email}
                            onChange={event => setEmail(event.target.value)}
                        />
                    </label>
                    <label style={styles.field}>
                        <span style={styles.label}>Password</span>
                        <input
                            style={styles.input}
                            type="password"
                            value={password}
                            onChange={event => setPassword(event.target.value)}
                        />
                    </label>
                    <div style={styles.actions}>
                        {isConfigured ? (
                            <>
                                <button
                                    type="button"
                                    style={styles.buttonPrimary}
                                    disabled={isAuthenticating}
                                    onClick={() => void handleCloudLogin()}
                                >
                                    Sign in
                                </button>
                                <button
                                    type="button"
                                    style={styles.button}
                                    disabled={isAuthenticating}
                                    onClick={() => void handleCloudRegister()}
                                >
                                    Register
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                style={styles.buttonPrimary}
                                onClick={() => void handleLocalLogin()}
                            >
                                Sign in
                            </button>
                        )}
                    </div>
                    {(error || authError) && <p style={styles.error}>{error ?? authError}</p>}
                </div>
            </div>
        );
    }

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div>
                    <div style={styles.headerLabel}>Customer portal</div>
                    <div style={styles.headerTitle}>{customer.name}</div>
                    <div style={styles.headerMeta}>{customer.company} · {customer.email}</div>
                </div>
                <button type="button" style={styles.button} onClick={() => void handleLogout()}>
                    Sign out
                </button>
            </header>

            <div style={styles.tabs}>
                {(["projects", "quotes", "reviews"] as const).map(tab => (
                    <button
                        key={tab}
                        type="button"
                        style={{
                            ...styles.tab,
                            ...(activeTab === tab ? styles.tabActive : undefined)
                        }}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === "projects" ? "Projects" : tab === "quotes" ? "Quotes" : "Reviews"}
                    </button>
                ))}
            </div>

            {activeTab === "projects" && (
                <div style={styles.grid}>
                    {projects.length === 0 ? (
                        <p style={styles.empty}>No projects assigned yet.</p>
                    ) : (
                        projects.map(project => (
                            <article key={project.projectId} style={styles.card}>
                                <div style={styles.cardTitle}>{project.projectName}</div>
                                <div style={styles.cardMeta}>
                                    Approval: {project.reviewStatus ?? "Not sent"}
                                </div>
                                <button
                                    type="button"
                                    style={styles.buttonPrimary}
                                    onClick={() => {
                                        window.location.href = buildPortalProjectPath(project.projectId);
                                    }}
                                >
                                    Open project
                                </button>
                            </article>
                        ))
                    )}
                </div>
            )}

            {activeTab === "quotes" && (
                <div style={styles.list}>
                    {quoteSummaries.length === 0 ? (
                        <p style={styles.empty}>No quote summaries available.</p>
                    ) : (
                        quoteSummaries.map(quote => {
                            const project = projects.find(entry => entry.projectId === quote.projectId);
                            return (
                                <div key={quote.projectId} style={styles.listRow}>
                                    <span>{project?.projectName ?? quote.projectId}</span>
                                    <span>{quote.total.toFixed(2)} {quote.currency}</span>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {activeTab === "reviews" && (
                <div style={styles.list}>
                    {projects.length === 0 ? (
                        <p style={styles.empty}>No review activity yet.</p>
                    ) : (
                        projects.map(project => (
                            <div key={project.projectId} style={styles.listRow}>
                                <span>{project.projectName}</span>
                                <span>{project.reviewStatus ?? "Not sent"}</span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

export function CustomerPortal({ projectId = null }: CustomerPortalProps) {
    return (
        <CloudSessionProvider>
            <CustomerPortalShell projectId={projectId} />
        </CloudSessionProvider>
    );
}

const styles = {
    page: {
        minHeight: "100vh",
        background: "#171a20",
        color: "#f7f7f2",
        padding: 24,
        boxSizing: "border-box" as const,
        fontFamily: "system-ui, sans-serif"
    },
    message: {
        display: "grid",
        placeItems: "center",
        minHeight: "60vh",
        color: "#d1d5db"
    },
    loginCard: {
        maxWidth: 420,
        margin: "10vh auto 0",
        padding: 24,
        borderRadius: 10,
        border: "1px solid #3b414a",
        background: "#20242b",
        display: "grid",
        gap: 12
    },
    title: {
        margin: 0,
        fontSize: 24
    },
    subtitle: {
        margin: 0,
        color: "#9aa3b2",
        fontSize: 13
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        gap: 16,
        alignItems: "flex-start",
        marginBottom: 20
    },
    headerLabel: {
        fontSize: 11,
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        color: "#9aa3b2"
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 600
    },
    headerMeta: {
        marginTop: 4,
        fontSize: 13,
        color: "#c5cad3"
    },
    tabs: {
        display: "flex",
        gap: 8,
        marginBottom: 16
    },
    tab: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 999,
        padding: "8px 14px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    tabActive: {
        borderColor: "#8ea0b8",
        background: "#3a4558"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
        gap: 12
    },
    card: {
        padding: 16,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#252932",
        display: "grid",
        gap: 10
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: 600
    },
    cardMeta: {
        fontSize: 12,
        color: "#9aa3b2"
    },
    list: {
        display: "grid",
        gap: 8
    },
    listRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        padding: "12px 14px",
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#252932",
        fontSize: 13
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
    actions: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap" as const
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
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 12
    }
};
