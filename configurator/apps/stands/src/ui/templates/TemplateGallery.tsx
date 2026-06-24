import { useEffect, useState } from "react";
import {
    DEFAULT_TEMPLATE_CATEGORIES,
    DEFAULT_TEMPLATE_THUMBNAIL,
    deleteTemplate,
    getTemplateCategoryName,
    listTemplates,
    type StandTemplate
} from "../../services/templates";
import { PermissionGuard } from "../auth";

interface TemplateGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onUseTemplate: (templateId: string) => Promise<void>;
    onCreateFromCurrent: (metadata: {
        name: string;
        description: string;
        categoryId: string;
    }) => Promise<void>;
    isBusy?: boolean;
}

export function TemplateGallery({
    isOpen,
    onClose,
    onUseTemplate,
    onCreateFromCurrent,
    isBusy = false
}: TemplateGalleryProps) {
    const [templates, setTemplates] = useState<StandTemplate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [createName, setCreateName] = useState("");
    const [createDescription, setCreateDescription] = useState("");
    const [createCategoryId, setCreateCategoryId] = useState(DEFAULT_TEMPLATE_CATEGORIES[0]!.id);

    const loadTemplates = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const next = await listTemplates();
            setTemplates(next);
        } catch (loadError) {
            console.warn("Template gallery load failed.", loadError);
            setError("Unable to load templates.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        void loadTemplates();
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleCreateTemplate = async () => {
        if (!createName.trim()) {
            return;
        }

        setError(null);

        try {
            await onCreateFromCurrent({
                name: createName.trim(),
                description: createDescription.trim(),
                categoryId: createCategoryId
            });
            setCreateOpen(false);
            setCreateName("");
            setCreateDescription("");
            setCreateCategoryId(DEFAULT_TEMPLATE_CATEGORIES[0]!.id);
            await loadTemplates();
        } catch (createError) {
            console.warn("Template creation failed.", createError);
            setError("Unable to create template from current project.");
        }
    };

    const handleDeleteTemplate = async (template: StandTemplate) => {
        const confirmed = window.confirm(`Delete template "${template.name}"?`);

        if (!confirmed) {
            return;
        }

        try {
            await deleteTemplate(template.id);
            await loadTemplates();
        } catch (deleteError) {
            console.warn("Template delete failed.", deleteError);
            setError("Unable to delete template.");
        }
    };

    return (
        <div style={styles.backdrop} onClick={onClose}>
            <div
                style={styles.modal}
                onClick={event => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="template-gallery-title"
            >
                <div style={styles.header}>
                    <div>
                        <h2 id="template-gallery-title" style={styles.title}>
                            Template Gallery
                        </h2>
                        <p style={styles.subtitle}>
                            Organization stand layouts. Using a template always creates a new project.
                        </p>
                    </div>
                    <button type="button" style={styles.iconButton} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div style={styles.actionsRow}>
                    <PermissionGuard action="projects.create">
                        <button
                            type="button"
                            style={styles.buttonPrimary}
                            disabled={isBusy}
                            onClick={() => setCreateOpen(true)}
                        >
                            Create Template From Current
                        </button>
                    </PermissionGuard>
                </div>

                {isLoading ? (
                    <p style={styles.empty}>Loading templates…</p>
                ) : templates.length === 0 ? (
                    <p style={styles.empty}>
                        No templates yet. Save the current stand layout to share it with your organization.
                    </p>
                ) : (
                    <div style={styles.grid}>
                        {templates.map(template => (
                            <article key={template.id} style={styles.card}>
                                <img
                                    style={styles.thumbnail}
                                    src={template.thumbnailUrl ?? DEFAULT_TEMPLATE_THUMBNAIL}
                                    alt=""
                                />
                                <div style={styles.cardBody}>
                                    <div style={styles.cardTitle}>{template.name}</div>
                                    <div style={styles.cardCategory}>
                                        {getTemplateCategoryName(template.category)}
                                    </div>
                                    {template.description && (
                                        <p style={styles.cardDescription}>{template.description}</p>
                                    )}
                                    <div style={styles.cardActions}>
                                        <PermissionGuard action="projects.create">
                                            <button
                                                type="button"
                                                style={styles.buttonPrimary}
                                                disabled={isBusy}
                                                onClick={() => void onUseTemplate(template.id)}
                                            >
                                                Use Template
                                            </button>
                                        </PermissionGuard>
                                        <PermissionGuard action="projects.delete">
                                            <button
                                                type="button"
                                                style={styles.dangerButton}
                                                disabled={isBusy}
                                                onClick={() => void handleDeleteTemplate(template)}
                                            >
                                                Delete
                                            </button>
                                        </PermissionGuard>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}

                {error && <p style={styles.error}>{error}</p>}

                {createOpen && (
                    <div style={styles.dialogOverlay}>
                        <div style={styles.dialog}>
                            <h3 style={styles.dialogTitle}>Create Template From Current</h3>
                            <label style={styles.field}>
                                <span style={styles.label}>Name</span>
                                <input
                                    style={styles.input}
                                    value={createName}
                                    onChange={event => setCreateName(event.target.value)}
                                    autoFocus
                                />
                            </label>
                            <label style={styles.field}>
                                <span style={styles.label}>Description</span>
                                <textarea
                                    style={styles.textarea}
                                    rows={3}
                                    value={createDescription}
                                    onChange={event => setCreateDescription(event.target.value)}
                                />
                            </label>
                            <label style={styles.field}>
                                <span style={styles.label}>Category</span>
                                <select
                                    style={styles.input}
                                    value={createCategoryId}
                                    onChange={event => setCreateCategoryId(event.target.value)}
                                >
                                    {DEFAULT_TEMPLATE_CATEGORIES.map(category => (
                                        <option key={category.id} value={category.id}>
                                            {category.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <div style={styles.dialogActions}>
                                <button
                                    type="button"
                                    style={styles.button}
                                    disabled={isBusy}
                                    onClick={() => setCreateOpen(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    style={styles.buttonPrimary}
                                    disabled={isBusy || !createName.trim()}
                                    onClick={() => void handleCreateTemplate()}
                                >
                                    Save Template
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
        zIndex: 60,
        padding: 20,
        boxSizing: "border-box" as const
    },
    modal: {
        width: "min(960px, 100%)",
        maxHeight: "min(85vh, 900px)",
        overflow: "auto",
        background: "#20242b",
        color: "#f7f7f2",
        border: "1px solid #3b414a",
        borderRadius: 10,
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.35)",
        padding: 20,
        display: "grid",
        gap: 16,
        fontFamily: "system-ui, sans-serif"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: "start"
    },
    title: {
        margin: 0,
        fontSize: 20
    },
    subtitle: {
        margin: "6px 0 0",
        color: "#c5cad3",
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
        fontSize: 20,
        lineHeight: 1
    },
    actionsRow: {
        display: "flex",
        gap: 8,
        flexWrap: "wrap" as const
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: 12
    },
    card: {
        border: "1px solid #3b414a",
        borderRadius: 8,
        overflow: "hidden",
        background: "#252932",
        display: "grid"
    },
    thumbnail: {
        width: "100%",
        aspectRatio: "16 / 10",
        objectFit: "cover" as const,
        display: "block",
        background: "#171b21"
    },
    cardBody: {
        padding: 12,
        display: "grid",
        gap: 8
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: 600
    },
    cardCategory: {
        fontSize: 11,
        color: "#9aa3b2",
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em"
    },
    cardDescription: {
        margin: 0,
        fontSize: 12,
        color: "#c5cad3"
    },
    cardActions: {
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
    dangerButton: {
        border: "1px solid #7a4048",
        background: "#4a2b31",
        color: "#ffd9de",
        borderRadius: 6,
        padding: "8px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12
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
    dialogOverlay: {
        position: "fixed" as const,
        inset: 0,
        background: "rgba(10, 12, 16, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 70
    },
    dialog: {
        width: "min(420px, calc(100vw - 40px))",
        background: "#20242b",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 16,
        display: "grid",
        gap: 12
    },
    dialogTitle: {
        margin: 0,
        fontSize: 16
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
    textarea: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        font: "inherit",
        fontSize: 13,
        width: "100%",
        boxSizing: "border-box" as const,
        resize: "vertical" as const
    },
    dialogActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8
    }
};
