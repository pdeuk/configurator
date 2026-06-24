import { useEffect, useState } from "react";
import {
    createCustomer,
    customerService,
    deleteCustomer,
    listCustomers,
    type Customer
} from "../../services/customer";

export function CustomersAdminTab() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [assignmentsByCustomer, setAssignmentsByCustomer] = useState<Record<string, string[]>>({});
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [company, setCompany] = useState("");
    const [portalPassword, setPortalPassword] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadCustomers = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const nextCustomers = await listCustomers();
            setCustomers(nextCustomers);

            const assignmentMap: Record<string, string[]> = {};

            await Promise.all(
                nextCustomers.map(async customer => {
                    const projects = await customerService.getCustomerProjects(customer.id);
                    assignmentMap[customer.id] = projects.map(project => project.projectName);
                })
            );

            setAssignmentsByCustomer(assignmentMap);
        } catch (loadError) {
            console.warn("Customers admin load failed.", loadError);
            setError("Unable to load customers.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadCustomers();
    }, []);

    const handleCreate = async () => {
        if (!name.trim() || !email.trim()) {
            return;
        }

        setError(null);

        try {
            await createCustomer({
                name: name.trim(),
                email: email.trim(),
                company: company.trim(),
                ...(portalPassword.trim() ? { portalPassword: portalPassword.trim() } : {})
            });
            setName("");
            setEmail("");
            setCompany("");
            setPortalPassword("");
            await loadCustomers();
        } catch (createError) {
            console.warn("Customer create failed.", createError);
            setError("Unable to create customer.");
        }
    };

    const handleDelete = async (customer: Customer) => {
        const confirmed = window.confirm(`Delete customer "${customer.name}"?`);

        if (!confirmed) {
            return;
        }

        try {
            await deleteCustomer(customer.id);
            await loadCustomers();
        } catch (deleteError) {
            console.warn("Customer delete failed.", deleteError);
            setError("Unable to delete customer.");
        }
    };

    if (isLoading) {
        return <p style={styles.empty}>Loading customers…</p>;
    }

    return (
        <div style={styles.container}>
            <div>
                <h3 style={styles.title}>Customers</h3>
                <p style={styles.subtitle}>
                    Manage organization customers and portal access. Assign projects from the project menu.
                </p>
            </div>

            <div style={styles.form}>
                <label style={styles.field}>
                    <span style={styles.label}>Name</span>
                    <input style={styles.input} value={name} onChange={event => setName(event.target.value)} />
                </label>
                <label style={styles.field}>
                    <span style={styles.label}>Email</span>
                    <input style={styles.input} value={email} onChange={event => setEmail(event.target.value)} />
                </label>
                <label style={styles.field}>
                    <span style={styles.label}>Company</span>
                    <input style={styles.input} value={company} onChange={event => setCompany(event.target.value)} />
                </label>
                <label style={styles.field}>
                    <span style={styles.label}>Portal password (local)</span>
                    <input
                        style={styles.input}
                        type="password"
                        value={portalPassword}
                        onChange={event => setPortalPassword(event.target.value)}
                    />
                </label>
                <button type="button" style={styles.buttonPrimary} onClick={() => void handleCreate()}>
                    Create customer
                </button>
            </div>

            {customers.length === 0 ? (
                <p style={styles.empty}>No customers yet.</p>
            ) : (
                <div style={styles.table}>
                    <div style={styles.tableHeader}>
                        <span>Name</span>
                        <span>Company</span>
                        <span>Email</span>
                        <span>Assigned projects</span>
                    </div>
                    {customers.map(customer => (
                        <div key={customer.id} style={styles.tableRow}>
                            <span>{customer.name}</span>
                            <span>{customer.company || "—"}</span>
                            <span>{customer.email}</span>
                            <span>
                                {(assignmentsByCustomer[customer.id] ?? []).join(", ") || "—"}
                            </span>
                            <button
                                type="button"
                                style={styles.dangerButton}
                                onClick={() => void handleDelete(customer)}
                            >
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {error && <p style={styles.error}>{error}</p>}
        </div>
    );
}

const styles = {
    container: {
        display: "grid",
        gap: 16
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
    form: {
        display: "grid",
        gap: 10,
        padding: 12,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#171b21"
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
        background: "#20242b",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13,
        width: "100%",
        boxSizing: "border-box" as const
    },
    buttonPrimary: {
        justifySelf: "start",
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    },
    table: {
        display: "grid",
        gap: 6
    },
    tableHeader: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1.2fr 1.4fr auto",
        gap: 8,
        fontSize: 11,
        color: "#9aa3b2",
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
        padding: "0 4px"
    },
    tableRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1.2fr 1.4fr auto",
        gap: 8,
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#171b21",
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
    },
    dangerButton: {
        border: "1px solid #7a4048",
        background: "#4a2b31",
        color: "#ffd9de",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    }
};
