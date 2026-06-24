import { useEffect, useState } from "react";
import {
    INVITABLE_ORGANIZATION_ROLES,
    formatOrganizationRole,
    type InvitableOrganizationRole,
    type OrganizationInvite,
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
        invites,
        isLoading,
        error,
        canManageUsers,
        updateMemberRole,
        createOrganizationInvite,
        revokeOrganizationInvite,
        removeOrganizationMember
    } = usePermissions();
    const [draftRoles, setDraftRoles] = useState<Record<string, OrganizationRole>>({});
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<InvitableOrganizationRole>("designer");
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [inviteMessage, setInviteMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const nextDraft: Record<string, OrganizationRole> = {};

        for (const member of members) {
            nextDraft[member.userId] = member.role;
        }

        setDraftRoles(nextDraft);
        setInviteEmail("");
        setInviteRole("designer");
        setSaveMessage(null);
        setInviteMessage(null);
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

    const handleInvite = async () => {
        const email = inviteEmail.trim().toLowerCase();

        if (!email) {
            setInviteMessage("Enter an email address.");
            return;
        }

        try {
            await createOrganizationInvite(email, inviteRole);
            setInviteEmail("");
            setInviteMessage(`Invited ${email} as ${formatOrganizationRole(inviteRole)}.`);
        } catch (inviteError) {
            setInviteMessage(
                inviteError instanceof Error
                    ? inviteError.message
                    : "Unable to send invite."
            );
        }
    };

    const handleRevokeInvite = async (invite: OrganizationInvite) => {
        await revokeOrganizationInvite(invite.id);
        setInviteMessage(`Revoked invite for ${invite.email}.`);
    };

    const handleRemoveMember = async (member: OrganizationMember) => {
        const confirmed = window.confirm(`Remove ${member.name} from this organization?`);

        if (!confirmed) {
            return;
        }

        await removeOrganizationMember(member.userId);
        setSaveMessage(`Removed ${member.name}`);
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
                        <p style={styles.subtitle}>Organization members, invites, emails, and roles.</p>
                    </div>
                    <button type="button" style={styles.iconButton} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                {!canManageUsers && (
                    <p style={styles.empty}>Only owners and admins can manage organization users.</p>
                )}

                {canManageUsers && (
                    <section style={styles.section}>
                        <h3 style={styles.sectionTitle}>Invite user</h3>
                        <div style={styles.inviteRow}>
                            <input
                                type="email"
                                style={styles.input}
                                placeholder="teammate@company.com"
                                value={inviteEmail}
                                onChange={event => setInviteEmail(event.target.value)}
                            />
                            <select
                                style={styles.select}
                                value={inviteRole}
                                onChange={event =>
                                    setInviteRole(event.target.value as InvitableOrganizationRole)
                                }
                            >
                                {INVITABLE_ORGANIZATION_ROLES.map(roleOption => (
                                    <option key={roleOption} value={roleOption}>
                                        {formatOrganizationRole(roleOption)}
                                    </option>
                                ))}
                            </select>
                            <button type="button" style={styles.primaryButton} onClick={() => void handleInvite()}>
                                Invite
                            </button>
                        </div>
                        {inviteMessage && <p style={styles.message}>{inviteMessage}</p>}
                    </section>
                )}

                {canManageUsers && invites.length > 0 && (
                    <section style={styles.section}>
                        <h3 style={styles.sectionTitle}>Pending invites</h3>
                        <div style={styles.list}>
                            {invites.map(invite => (
                                <div key={invite.id} style={styles.row}>
                                    <div style={styles.memberMain}>
                                        <div style={styles.memberName}>{invite.email}</div>
                                        <div style={styles.memberEmail}>
                                            {formatOrganizationRole(invite.role)} · pending signup
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        style={styles.dangerButton}
                                        onClick={() => void handleRevokeInvite(invite)}
                                    >
                                        Revoke
                                    </button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section style={styles.section}>
                    <h3 style={styles.sectionTitle}>Members</h3>
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
                                        {INVITABLE_ORGANIZATION_ROLES.map(roleOption => (
                                            <option key={roleOption} value={roleOption}>
                                                {formatOrganizationRole(roleOption)}
                                            </option>
                                        ))}
                                        <option value="owner">{formatOrganizationRole("owner")}</option>
                                    </select>
                                    <button
                                        type="button"
                                        style={styles.button}
                                        disabled={!canManageUsers || member.role === "owner"}
                                        onClick={() => void handleSave(member)}
                                    >
                                        Save
                                    </button>
                                    {canManageUsers && member.role !== "owner" && (
                                        <button
                                            type="button"
                                            style={styles.dangerButton}
                                            onClick={() => void handleRemoveMember(member)}
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </section>

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
    section: {
        display: "grid",
        gap: 10
    },
    sectionTitle: {
        margin: 0,
        fontSize: 12,
        fontWeight: 700,
        color: "#cbd3dc",
        textTransform: "uppercase",
        letterSpacing: "0.04em"
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
    inviteRow: {
        display: "grid",
        gridTemplateColumns: "1fr 160px 90px",
        gap: 10,
        alignItems: "center"
    },
    list: {
        display: "grid",
        gap: 10
    },
    row: {
        display: "grid",
        gridTemplateColumns: "1fr 160px 80px 90px",
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
    input: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13
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
    primaryButton: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
    },
    dangerButton: {
        border: "1px solid #7f1d1d",
        background: "#3f1d24",
        color: "#fecaca",
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
