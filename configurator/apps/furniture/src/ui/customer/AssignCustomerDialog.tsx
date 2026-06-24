import { useEffect, useState } from "react";
import {
    assignProjectToCustomer,
    customerService,
    listCustomers,
    removeProjectAccess,
    type Customer
} from "../../services/customer";
import { useProjectSession } from "../projects/projectSession";

interface AssignCustomerDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AssignCustomerDialog({ isOpen, onClose }: AssignCustomerDialogProps) {
    const { activeProjectId } = useProjectSession();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState("");
    const [canView, setCanView] = useState(true);
    const [canComment, setCanComment] = useState(true);
    const [canApprove, setCanApprove] = useState(true);
    const [assignedCustomerIds, setAssignedCustomerIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const loadState = async () => {
        setError(null);

        try {
            const [nextCustomers, assignments] = await Promise.all([
                listCustomers(),
                customerService.listProjectAssignments(activeProjectId)
            ]);
            setCustomers(nextCustomers);
            setAssignedCustomerIds(assignments.map(entry => entry.customerId));
            setSelectedCustomerId(nextCustomers[0]?.id ?? "");
        } catch (loadError) {
            console.warn("Assign customer dialog load failed.", loadError);
            setError("Unable to load customers.");
        }
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        void loadState();
    }, [activeProjectId, isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleAssign = async () => {
        if (!selectedCustomerId) {
            return;
        }

        setIsBusy(true);
        setError(null);

        try {
            await assignProjectToCustomer({
                customerId: selectedCustomerId,
                projectId: activeProjectId,
                permissions: {
                    view: canView,
                    comment: canComment,
                    approve: canApprove
                }
            });
            setMessage("Customer assigned to project.");
            await loadState();
        } catch (assignError) {
            console.warn("Assign customer failed.", assignError);
            setError("Unable to assign customer.");
        } finally {
            setIsBusy(false);
        }
    };

    const handleRemove = async (customerId: string) => {
        setIsBusy(true);
        setError(null);

        try {
            await removeProjectAccess(customerId, activeProjectId);
            setMessage("Customer access removed.");
            await loadState();
        } catch (removeError) {
            console.warn("Remove customer access failed.", removeError);
            setError("Unable to remove customer access.");
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div style={styles.modal} onClick={event => event.stopPropagation()} role="dialog" aria-modal="true">
                <div style={styles.header}>
                    <h2 style={styles.title}>Assign Customer</h2>
                    <button type="button" style={styles.iconButton} onClick={onClose}>×</button>
                </div>

                <label style={styles.field}>
                    <span style={styles.label}>Customer</span>
                    <select
                        style={styles.input}
                        value={selectedCustomerId}
                        onChange={event => setSelectedCustomerId(event.target.value)}
                    >
                        {customers.map(customer => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} · {customer.company}
                            </option>
                        ))}
                    </select>
                </label>

                <div style={styles.checkboxGroup}>
                    <label style={styles.checkboxRow}>
                        <input type="checkbox" checked={canView} onChange={event => setCanView(event.target.checked)} />
                        <span>View</span>
                    </label>
                    <label style={styles.checkboxRow}>
                        <input type="checkbox" checked={canComment} onChange={event => setCanComment(event.target.checked)} />
                        <span>Comment</span>
                    </label>
                    <label style={styles.checkboxRow}>
                        <input type="checkbox" checked={canApprove} onChange={event => setCanApprove(event.target.checked)} />
                        <span>Approve</span>
                    </label>
                </div>

                <button
                    type="button"
                    style={styles.buttonPrimary}
                    disabled={isBusy || !selectedCustomerId}
                    onClick={() => void handleAssign()}
                >
                    Assign to current project
                </button>

                {assignedCustomerIds.length > 0 && (
                    <div style={styles.section}>
                        <div style={styles.sectionTitle}>Assigned customers</div>
                        {assignedCustomerIds.map(customerId => {
                            const customer = customers.find(entry => entry.id === customerId);
                            return (
                                <div key={customerId} style={styles.assignedRow}>
                                    <span>{customer?.name ?? customerId}</span>
                                    <button
                                        type="button"
                                        style={styles.dangerButton}
                                        disabled={isBusy}
                                        onClick={() => void handleRemove(customerId)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {message && <p style={styles.message}>{message}</p>}
                {error && <p style={styles.error}>{error}</p>}
            </div>
        </div>
    );
}

const styles = {
    backdrop: {
        position: "fixed" as const,
        inset: 0,
        background: "rgba(10, 12, 16, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 80,
        padding: 20,
        boxSizing: "border-box" as const
    },
    modal: {
        width: "min(480px, 100%)",
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 10,
        padding: 20,
        display: "grid",
        gap: 12,
        fontFamily: "system-ui, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center"
    },
    title: {
        margin: 0,
        fontSize: 18
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
    checkboxGroup: {
        display: "grid",
        gap: 8
    },
    checkboxRow: {
        display: "flex",
        alignItems: "center",
        gap: 8,
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
    section: {
        display: "grid",
        gap: 8,
        paddingTop: 8,
        borderTop: "1px solid #3b414a"
    },
    sectionTitle: {
        fontSize: 12,
        color: "#9aa3b2",
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em"
    },
    assignedRow: {
        display: "flex",
        justifyContent: "space-between",
        gap: 8,
        alignItems: "center",
        padding: "8px 10px",
        borderRadius: 6,
        border: "1px solid #3b414a",
        background: "#171b21",
        fontSize: 13
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
