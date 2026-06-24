import { useEffect, useMemo, useState } from "react";
import {
    createCatalogItemFromModule,
    DEFAULT_CATALOG_CATEGORIES,
    DEFAULT_CATALOG_THUMBNAIL,
    deleteCatalogItem,
    formatCatalogDimensions,
    getCatalogCategoryName,
    inferCatalogCategoryFromModule,
    insertCatalogItemIntoProject,
    listCatalogItems,
    type CatalogItem
} from "../../services/catalog";
import { trackEvent } from "../../services/analytics";
import { COMPONENT_OPTIONS } from "../../utils/componentCatalog";
import { useEditorStore } from "../../store/editorStore";
import { PermissionGuard, usePermissions } from "../auth";

export function ComponentLibraryPanel() {
    const { can } = usePermissions();
    const selectedId = useEditorStore(state => state.selectedId);
    const modulesById = useEditorStore(state => state.modulesById);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const select = useEditorStore(state => state.select);
    const addModule = useEditorStore(state => state.addModule);

    const [items, setItems] = useState<CatalogItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [saveOpen, setSaveOpen] = useState(false);
    const [saveName, setSaveName] = useState("");
    const [saveDescription, setSaveDescription] = useState("");
    const [saveCategoryId, setSaveCategoryId] = useState(DEFAULT_CATALOG_CATEGORIES[0]!.id);
    const [isBusy, setIsBusy] = useState(false);

    const selectedModule = selectedId ? modulesById[selectedId] : undefined;

    const loadItems = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const next = await listCatalogItems();
            setItems(next);
        } catch (loadError) {
            console.warn("Component catalog load failed.", loadError);
            setError("Unable to load component catalog.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void loadItems();
    }, []);

    const filteredItems = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLowerCase();

        return items.filter(item => {
            if (categoryFilter !== "all" && item.category !== categoryFilter) {
                return false;
            }

            if (!normalizedQuery) {
                return true;
            }

            return (
                item.name.toLowerCase().includes(normalizedQuery)
                || item.description.toLowerCase().includes(normalizedQuery)
                || getCatalogCategoryName(item.category).toLowerCase().includes(normalizedQuery)
            );
        });
    }, [categoryFilter, items, searchQuery]);

    const handleAddToScene = (item: CatalogItem) => {
        if (!can("projects.edit")) {
            return;
        }

        select(null);
        addModule(
            insertCatalogItemIntoProject(item, {
                moduleCount: moduleIds.length
            })
        );
        void trackEvent({
            event: "catalog.item_used",
            entityType: "catalog_item",
            entityId: item.id,
            metadata: { label: item.name }
        });
        setMessage(`Added ${item.name} to the scene.`);
    };

    const handleOpenSaveDialog = () => {
        if (!selectedModule) {
            setError("Select a module in the scene to save as a component.");
            return;
        }

        setSaveName(
            COMPONENT_OPTIONS.find(option => option.id === selectedModule.type)?.label
                ?? `${selectedModule.type} component`
        );
        setSaveDescription("");
        setSaveCategoryId(inferCatalogCategoryFromModule(selectedModule));
        setSaveOpen(true);
        setError(null);
    };

    const handleSaveComponent = async () => {
        if (!selectedModule || !saveName.trim()) {
            return;
        }

        setIsBusy(true);
        setError(null);

        try {
            await createCatalogItemFromModule(selectedModule, {
                name: saveName.trim(),
                description: saveDescription.trim(),
                categoryId: saveCategoryId
            });
            setSaveOpen(false);
            setMessage("Component saved to organization catalog.");
            await loadItems();
        } catch (saveError) {
            console.warn("Component catalog save failed.", saveError);
            setError("Unable to save component.");
        } finally {
            setIsBusy(false);
        }
    };

    const handleDeleteItem = async (item: CatalogItem) => {
        const confirmed = window.confirm(`Delete component "${item.name}"?`);

        if (!confirmed) {
            return;
        }

        try {
            await deleteCatalogItem(item.id);
            await loadItems();
        } catch (deleteError) {
            console.warn("Component catalog delete failed.", deleteError);
            setError("Unable to delete component.");
        }
    };

    return (
        <div style={styles.panel}>
            <div style={styles.header}>
                <h3 style={styles.title}>Component Library</h3>
                <PermissionGuard action="settings.edit">
                    <button
                        type="button"
                        style={styles.saveButton}
                        disabled={!selectedModule || isBusy}
                        onClick={handleOpenSaveDialog}
                    >
                        Save Selected
                    </button>
                </PermissionGuard>
            </div>

            <label style={styles.field}>
                <span style={styles.label}>Search</span>
                <input
                    style={styles.input}
                    value={searchQuery}
                    placeholder="Search components…"
                    onChange={event => setSearchQuery(event.target.value)}
                />
            </label>

            <label style={styles.field}>
                <span style={styles.label}>Category</span>
                <select
                    style={styles.input}
                    value={categoryFilter}
                    onChange={event => setCategoryFilter(event.target.value)}
                >
                    <option value="all">All categories</option>
                    {DEFAULT_CATALOG_CATEGORIES.map(category => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </label>

            <div style={styles.list}>
                {isLoading ? (
                    <p style={styles.empty}>Loading components…</p>
                ) : filteredItems.length === 0 ? (
                    <p style={styles.empty}>No components match your filters.</p>
                ) : (
                    filteredItems.map(item => (
                        <article key={item.id} style={styles.card}>
                            <img
                                style={styles.thumbnail}
                                src={item.thumbnail ?? DEFAULT_CATALOG_THUMBNAIL}
                                alt=""
                            />
                            <div style={styles.cardBody}>
                                <div style={styles.cardTitle}>{item.name}</div>
                                <div style={styles.cardMeta}>
                                    {getCatalogCategoryName(item.category)}
                                    · {formatCatalogDimensions(item.defaultDimensions)}
                                </div>
                                <div style={styles.cardActions}>
                                    <PermissionGuard action="projects.edit">
                                        <button
                                            type="button"
                                            style={styles.addButton}
                                            onClick={() => handleAddToScene(item)}
                                        >
                                            Add to Scene
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard action="settings.edit">
                                        <button
                                            type="button"
                                            style={styles.deleteButton}
                                            onClick={() => void handleDeleteItem(item)}
                                        >
                                            Delete
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        </article>
                    ))
                )}
            </div>

            {message && <p style={styles.message}>{message}</p>}
            {error && <p style={styles.error}>{error}</p>}

            {saveOpen && (
                <div style={styles.dialogOverlay}>
                    <div style={styles.dialog}>
                        <h4 style={styles.dialogTitle}>Save Module as Component</h4>
                        <label style={styles.field}>
                            <span style={styles.label}>Name</span>
                            <input
                                style={styles.input}
                                value={saveName}
                                onChange={event => setSaveName(event.target.value)}
                                autoFocus
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Description</span>
                            <textarea
                                style={styles.textarea}
                                rows={3}
                                value={saveDescription}
                                onChange={event => setSaveDescription(event.target.value)}
                            />
                        </label>
                        <label style={styles.field}>
                            <span style={styles.label}>Category</span>
                            <select
                                style={styles.input}
                                value={saveCategoryId}
                                onChange={event => setSaveCategoryId(event.target.value)}
                            >
                                {DEFAULT_CATALOG_CATEGORIES.map(category => (
                                    <option key={category.id} value={category.id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <div style={styles.dialogActions}>
                            <button
                                type="button"
                                style={styles.secondaryButton}
                                disabled={isBusy}
                                onClick={() => setSaveOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                style={styles.saveButton}
                                disabled={isBusy || !saveName.trim()}
                                onClick={() => void handleSaveComponent()}
                            >
                                Save Component
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    panel: {
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column" as const,
        gap: 10,
        padding: 12,
        borderRadius: 10,
        border: "1px solid #3b414a",
        background: "rgba(32, 36, 43, 0.92)",
        color: "#f7f7f2",
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
        position: "relative" as const
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8
    },
    title: {
        margin: 0,
        fontSize: 14
    },
    field: {
        display: "grid",
        gap: 4
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
        padding: "7px 9px",
        font: "inherit",
        fontSize: 12,
        width: "100%",
        boxSizing: "border-box" as const
    },
    textarea: {
        border: "1px solid #4b5562",
        background: "#171b21",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "7px 9px",
        font: "inherit",
        fontSize: 12,
        width: "100%",
        boxSizing: "border-box" as const,
        resize: "vertical" as const
    },
    list: {
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        display: "grid",
        gap: 8,
        alignContent: "start"
    },
    card: {
        display: "grid",
        gridTemplateColumns: "72px 1fr",
        gap: 8,
        padding: 8,
        borderRadius: 8,
        border: "1px solid #3b414a",
        background: "#252932"
    },
    thumbnail: {
        width: 72,
        height: 54,
        objectFit: "cover" as const,
        borderRadius: 6,
        background: "#171b21"
    },
    cardBody: {
        display: "grid",
        gap: 4,
        minWidth: 0
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: 600
    },
    cardMeta: {
        fontSize: 11,
        color: "#9aa3b2"
    },
    cardActions: {
        display: "flex",
        gap: 6,
        flexWrap: "wrap" as const
    },
    addButton: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "5px 8px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 11
    },
    saveButton: {
        border: "1px solid #8ea0b8",
        background: "#3a4558",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 11
    },
    secondaryButton: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "6px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 11
    },
    deleteButton: {
        border: "1px solid #7a4048",
        background: "#4a2b31",
        color: "#ffd9de",
        borderRadius: 6,
        padding: "5px 8px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 11
    },
    empty: {
        margin: 0,
        fontSize: 12,
        color: "#9aa3b2"
    },
    message: {
        margin: 0,
        fontSize: 11,
        color: "#cbd5e1"
    },
    error: {
        margin: 0,
        fontSize: 11,
        color: "#fca5a5"
    },
    dialogOverlay: {
        position: "absolute" as const,
        inset: 0,
        background: "rgba(10, 12, 16, 0.72)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        zIndex: 5
    },
    dialog: {
        width: "calc(100% - 24px)",
        maxWidth: 320,
        background: "#20242b",
        border: "1px solid #3b414a",
        borderRadius: 8,
        padding: 12,
        display: "grid",
        gap: 10
    },
    dialogTitle: {
        margin: 0,
        fontSize: 13
    },
    dialogActions: {
        display: "flex",
        justifyContent: "flex-end",
        gap: 8
    }
};
