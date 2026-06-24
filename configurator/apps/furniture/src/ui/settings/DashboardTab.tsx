import { useEffect, useState } from "react";
import {
    getDashboardMetrics,
    getProjectStats,
    getSalesStats,
    type DashboardMetrics,
    type ProjectStats,
    type RankedUsageItem,
    type SalesStats
} from "../../services/analytics";
import { errorTrackingService } from "../../services/system";

function formatCurrency(value: number): string {
    return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0
    }).format(value);
}

function formatPercent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

function formatShortDate(date: string): string {
    return new Date(`${date}T00:00:00.000Z`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric"
    });
}

interface BarChartProps {
    title: string;
    labels: string[];
    series: Array<{
        key: string;
        label: string;
        color: string;
        values: number[];
    }>;
}

function GroupedBarChart({ title, labels, series }: BarChartProps) {
    const maxValue = Math.max(
        1,
        ...series.flatMap(entry => entry.values)
    );

    return (
        <section style={styles.chartCard}>
            <h4 style={styles.chartTitle}>{title}</h4>
            <div style={styles.chartBody}>
                {labels.map((label, index) => (
                    <div key={label} style={styles.chartColumn}>
                        <div style={styles.barStack}>
                            {series.map(entry => {
                                const value = entry.values[index] ?? 0;
                                const height = `${Math.max(4, (value / maxValue) * 100)}%`;

                                return (
                                    <div
                                        key={entry.key}
                                        title={`${entry.label}: ${value}`}
                                        style={{
                                            ...styles.bar,
                                            height,
                                            background: entry.color
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <span style={styles.chartLabel}>{formatShortDate(label)}</span>
                    </div>
                ))}
            </div>
            <div style={styles.legend}>
                {series.map(entry => (
                    <span key={entry.key} style={styles.legendItem}>
                        <span
                            style={{
                                ...styles.legendSwatch,
                                background: entry.color
                            }}
                        />
                        {entry.label}
                    </span>
                ))}
            </div>
        </section>
    );
}

interface UsageListProps {
    title: string;
    items: RankedUsageItem[];
    emptyLabel: string;
}

function UsageList({ title, items, emptyLabel }: UsageListProps) {
    const maxCount = Math.max(1, ...items.map(item => item.count));

    return (
        <section style={styles.chartCard}>
            <h4 style={styles.chartTitle}>{title}</h4>
            {items.length === 0 ? (
                <p style={styles.empty}>{emptyLabel}</p>
            ) : (
                <div style={styles.usageList}>
                    {items.map(item => (
                        <div key={item.entityId} style={styles.usageRow}>
                            <div style={styles.usageHeader}>
                                <span>{item.label}</span>
                                <span style={styles.usageCount}>{item.count}</span>
                            </div>
                            <div style={styles.usageTrack}>
                                <div
                                    style={{
                                        ...styles.usageFill,
                                        width: `${(item.count / maxCount) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}

export function DashboardTab() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [projectStats, setProjectStats] = useState<ProjectStats | null>(null);
    const [salesStats, setSalesStats] = useState<SalesStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadDashboard = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [nextMetrics, nextProjectStats, nextSalesStats] = await Promise.all([
                getDashboardMetrics(),
                getProjectStats(14),
                getSalesStats(14)
            ]);

            setMetrics(nextMetrics);
            setProjectStats(nextProjectStats);
            setSalesStats(nextSalesStats);
        } catch (loadError) {
            errorTrackingService.captureError(loadError, {
                context: "dashboard.load"
            });
            setError("Unable to load analytics dashboard.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadDashboard();
    }, []);

    if (isLoading) {
        return <p style={styles.empty}>Loading dashboard…</p>;
    }

    if (!metrics || !projectStats || !salesStats) {
        return <p style={styles.empty}>Dashboard data is unavailable.</p>;
    }

    const projectLabels = projectStats.points.map(point => point.date);
    const salesLabels = salesStats.points.map(point => point.date);

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h3 style={styles.title}>Analytics Dashboard</h3>
                    <p style={styles.subtitle}>
                        Organization activity tracked separately from project documents.
                    </p>
                </div>
                <button type="button" style={styles.button} onClick={() => void loadDashboard()}>
                    Refresh
                </button>
            </div>

            <div style={styles.cardGrid}>
                <MetricCard
                    label="Projects"
                    value={String(metrics.projects.createdThisMonth)}
                    hint={`${metrics.projects.activeProjects} active · ${metrics.projects.completedProjects} completed`}
                />
                <MetricCard
                    label="Quotes"
                    value={String(metrics.sales.quotesCreated)}
                    hint="Created this month"
                />
                <MetricCard
                    label="Revenue"
                    value={formatCurrency(metrics.sales.quoteValue)}
                    hint="Quoted value this month"
                />
                <MetricCard
                    label="Approval Rate"
                    value={formatPercent(metrics.sales.approvalRate)}
                    hint={`${metrics.customers.pendingApprovals} pending approvals`}
                />
            </div>

            <div style={styles.secondaryGrid}>
                <MetricCard
                    label="Active Customers"
                    value={String(metrics.customers.activeCustomers)}
                    hint="Customers in this organization"
                />
                <MetricCard
                    label="Pending Approvals"
                    value={String(metrics.customers.pendingApprovals)}
                    hint="Quoted projects awaiting approval"
                />
            </div>

            <GroupedBarChart
                title="Project Activity (14 days)"
                labels={projectLabels}
                series={[
                    {
                        key: "created",
                        label: "Created",
                        color: "#60a5fa",
                        values: projectStats.points.map(point => point.created)
                    },
                    {
                        key: "opened",
                        label: "Opened",
                        color: "#34d399",
                        values: projectStats.points.map(point => point.opened)
                    },
                    {
                        key: "completed",
                        label: "Completed",
                        color: "#fbbf24",
                        values: projectStats.points.map(point => point.completed)
                    }
                ]}
            />

            <GroupedBarChart
                title="Quote Trend (14 days)"
                labels={salesLabels}
                series={[
                    {
                        key: "created",
                        label: "Quotes created",
                        color: "#a78bfa",
                        values: salesStats.points.map(point => point.quotesCreated)
                    },
                    {
                        key: "exported",
                        label: "Quotes exported",
                        color: "#f472b6",
                        values: salesStats.points.map(point => point.quotesExported)
                    }
                ]}
            />

            <UsageList
                title="Popular Templates"
                items={metrics.products.mostUsedTemplates}
                emptyLabel="No template usage recorded yet."
            />

            <UsageList
                title="Popular Components"
                items={metrics.products.mostUsedComponents}
                emptyLabel="No component usage recorded yet."
            />

            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

interface MetricCardProps {
    label: string;
    value: string;
    hint: string;
}

function MetricCard({ label, value, hint }: MetricCardProps) {
    return (
        <div style={styles.metricCard}>
            <div style={styles.metricLabel}>{label}</div>
            <div style={styles.metricValue}>{value}</div>
            <div style={styles.metricHint}>{hint}</div>
        </div>
    );
}

const styles = {
    container: {
        display: "grid",
        gap: 16
    },
    headerRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12
    },
    title: {
        margin: 0,
        fontSize: 14
    },
    subtitle: {
        margin: "4px 0 0",
        fontSize: 12,
        color: "#9aa3b2"
    },
    cardGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12
    },
    secondaryGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12
    },
    metricCard: {
        display: "grid",
        gap: 6,
        padding: "14px 16px",
        borderRadius: 10,
        border: "1px solid #3b414a",
        background: "#171b21"
    },
    metricLabel: {
        fontSize: 11,
        color: "#9aa3b2",
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em"
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 600
    },
    metricHint: {
        fontSize: 12,
        color: "#9aa3b2"
    },
    chartCard: {
        display: "grid",
        gap: 12,
        padding: 16,
        borderRadius: 10,
        border: "1px solid #3b414a",
        background: "#171b21"
    },
    chartTitle: {
        margin: 0,
        fontSize: 13,
        fontWeight: 600
    },
    chartBody: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(28px, 1fr))",
        gap: 8,
        alignItems: "end",
        minHeight: 160
    },
    chartColumn: {
        display: "grid",
        gap: 6,
        justifyItems: "center"
    },
    barStack: {
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: 3,
        width: "100%",
        height: 120
    },
    bar: {
        width: 8,
        borderRadius: 4,
        minHeight: 4
    },
    chartLabel: {
        fontSize: 10,
        color: "#9aa3b2",
        textAlign: "center" as const
    },
    legend: {
        display: "flex",
        flexWrap: "wrap" as const,
        gap: 12
    },
    legendItem: {
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: "#d1d5db"
    },
    legendSwatch: {
        width: 10,
        height: 10,
        borderRadius: 999
    },
    usageList: {
        display: "grid",
        gap: 10
    },
    usageRow: {
        display: "grid",
        gap: 6
    },
    usageHeader: {
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        fontSize: 13
    },
    usageCount: {
        color: "#9aa3b2"
    },
    usageTrack: {
        height: 8,
        borderRadius: 999,
        background: "#2d3440",
        overflow: "hidden"
    },
    usageFill: {
        height: "100%",
        borderRadius: 999,
        background: "linear-gradient(90deg, #60a5fa, #a78bfa)"
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
    empty: {
        margin: 0,
        color: "#9aa3b2",
        fontSize: 13
    },
    error: {
        margin: 0,
        color: "#fca5a5",
        fontSize: 12
    }
};
