import { useEffect, useState } from "react";
import {
    ORGANIZATION_ROLES,
    formatOrganizationRole,
    type OrganizationMember,
    type OrganizationRole
} from "../../services/auth";
import { usePermissions } from "./PermissionsProvider";

interface UserManagementPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserManagementPanel({ isOpen, onClose }: UserManagementPanelProps) {
    const {
        members,
        isLoading,
        error,
        canManageUsers,
        updateMemberRole
    } = usePermissions();
    const [draftRoles, setDraftRoles] = useState<Record<string, OrganizationRole>>({});
    const [saveMessage, setSaveMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const nextDraft: Record<string, OrganizationRole> = {};

        for (const member of members) {
            nextDraft[member.userId] = member.role;
        }

        setDraftRoles(nextDraft);
    }, [isOpen, members]);

    if (!isOpen) {
        return null;
    }

    const handleSave = async (member: OrganizationMember) => {
        const nextRole = draftRoles[member.userId];

        if (!nextRole || nextRole === member.role) {
            return;
        }

        await updateMemberRole(member.userId, nextRole);
        setSaveMessage(`Updated ${member.name}`);
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div
                style={styles.modal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-management-title"
            >
                <div style={styles.header}>
                    <div>
                        <h2 id="user-management-title" style={styles.title}>User Management</h2>
                        <p style={styles.subtitle}>Organization members, emails, and roles.</p>
                    </div>
                    <button type="button" style={styles.iconButton} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                {!canManageUsers && (
                    <p style={styles.empty}>Only owners and admins can manage organization users.</p>
                )}

                {isLoading ? (
                    <p style={styles.empty}>Loading members…</p>
                ) : (
                    <div style={styles.list}>
                        {members.map(member => (
                            <div key={member.userId} style={styles.row}>
                                <div style={styles.memberMain}>
                                    <div style={styles.memberName}>{member.name}</div>
                                    <div style={styles.memberEmail}>{member.email}</div>
                                </div>
                                <select
                                    style={styles.select}
                                    value={draftRoles[member.userId] ?? member.role}
                                    disabled={!canManageUsers || member.role === "owner"}
                                    onChange={event =>
                                        setDraftRoles(current => ({
                                            ...current,
                                            [member.userId]: event.target.value as OrganizationRole
                                        }))
                                    }
                                >
                                    {ORGANIZATION_ROLES.map(roleOption => (
                                        <option key={roleOption} value={roleOption}>
                                            {formatOrganizationRole(roleOption)}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    style={styles.button}
                                    disabled={!canManageUsers || member.role === "owner"}
                                    onClick={() => void handleSave(member)}
                                >
                                    Save
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {saveMessage && <p style={styles.message}>{saveMessage}</p>}
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
        zIndex: 46,
        padding: 20,
        boxSizing: "border-box"
    },
    modal: {
        width: "min(760px, 100%)",
        maxHeight: "min(80vh, 820px)",
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
    list: {
        display: "grid",
        gap: 10
    },
    row: {
        display: "grid",
        gridTemplateColumns: "1fr 160px 80px",
        gap: 10,
        alignItems: "center",
        padding: "10px 12px",
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#252932"
    },
    memberMain: {
        display: "grid",
        gap: 4,
        minWidth: 0
    },
    memberName: {
        fontSize: 14,
        fontWeight: 600
    },
    memberEmail: {
        fontSize: 12,
        color: "#9aa3b2",
        overflow: "hidden",
        textOverflow: "ellipsis"
    },
    select: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13
    },
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    empty: {
        margin: 0,
        color: "#9aa3b2",
        fontSize: 13
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
} satisfies Record<string, import("react").CSSProperties>;
