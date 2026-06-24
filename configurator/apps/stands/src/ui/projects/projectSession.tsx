import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode
} from "react";
import type { ProjectDocument } from "../../models/ProjectModel";
import { useProjectPersistence } from "../../hooks/useProjectPersistence";
import {
    pickProjectDocumentMetadata,
    readActiveProjectId,
    readProjectDocumentOrDefault,
    writeActiveProjectId
} from "../../lib/projectPersistence";
import { selectPersistableEditorState } from "../../lib/projectSerialization";
import {
    createDefaultProjectDocument,
    DEFAULT_PROJECT_NAME
} from "../../services/ProjectService";
import { getCloudStorageContext } from "../../services/cloud/HybridProjectStorage";
import { auditService } from "../../services/system";
import { trackEvent } from "../../services/analytics";
import { templateService, getTemplate } from "../../services/templates";
import { revisionService, type ProjectRevision } from "../../services/versions";
import { useEditorStore } from "../../store/editorStore";

interface ProjectSessionContextValue {
    projects: ProjectDocument[];
    activeProjectId: string;
    activeProjectName: string;
    isManagerOpen: boolean;
    isTemplateGalleryOpen: boolean;
    isBusy: boolean;
    openManager: () => void;
    closeManager: () => void;
    openTemplateGallery: () => void;
    closeTemplateGallery: () => void;
    refreshProjects: () => Promise<void>;
    saveActiveProject: () => Promise<ProjectDocument>;
    createNewProject: () => Promise<void>;
    createProjectFromTemplate: (templateId: string, name?: string) => Promise<void>;
    createTemplateFromCurrentProject: (metadata: {
        name: string;
        description: string;
        categoryId: string;
    }) => Promise<void>;
    openProject: (projectId: string) => Promise<void>;
    deleteProject: (projectId: string) => Promise<void>;
    renameProject: (projectId: string, name: string) => Promise<void>;
    saveRevision: (message?: string) => Promise<ProjectRevision | null>;
    restoreProjectRevision: (revisionId: string) => Promise<void>;
}

const ProjectSessionContext = createContext<ProjectSessionContextValue | null>(null);

function createUniqueProjectName(projects: ProjectDocument[]): string {
    const existingNames = new Set(projects.map(project => project.name));
    const baseName = DEFAULT_PROJECT_NAME;

    if (!existingNames.has(baseName)) {
        return baseName;
    }

    let index = 2;

    while (existingNames.has(`${baseName} ${index}`)) {
        index += 1;
    }

    return `${baseName} ${index}`;
}

function formatProjectSummary(document: ProjectDocument) {
    return {
        id: document.id,
        name: document.name,
        updatedAt: document.updatedAt,
        moduleCount: document.modules.length,
        floorWidthCm: Math.round(document.floor.width * 100),
        floorDepthCm: Math.round(document.floor.depth * 100)
    };
}

export function useProjectSession() {
    const context = useContext(ProjectSessionContext);

    if (!context) {
        throw new Error("useProjectSession must be used within ProjectSessionProvider");
    }

    return context;
}

export { formatProjectSummary };

interface ProjectSessionProviderProps {
    children: ReactNode;
}

export function ProjectSessionProvider({ children }: ProjectSessionProviderProps) {
    const initialProjectId = readActiveProjectId();
    const initialDocument = readProjectDocumentOrDefault(initialProjectId);
    const [activeProjectId, setActiveProjectId] = useState(initialProjectId);
    const [activeProjectName, setActiveProjectName] = useState(initialDocument.name);
    const [projects, setProjects] = useState<ProjectDocument[]>([]);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [isTemplateGalleryOpen, setIsTemplateGalleryOpen] = useState(false);
    const [isBusy, setIsBusy] = useState(false);

    const {
        projectService,
        saveProject,
        hydrateProjectDocument,
        getMetadata,
        setMetadata
    } = useProjectPersistence({
        projectId: activeProjectId,
        projectName: activeProjectName,
        onHydrated: document => {
            setActiveProjectName(document.name);
            writeActiveProjectId(document.id);
        }
    });

    const refreshProjects = useCallback(async () => {
        const nextProjects = await projectService.listProjects();
        setProjects(nextProjects);
    }, [projectService]);

    const saveActiveProject = useCallback(async () => {
        setIsBusy(true);

        try {
            const document = await saveProject();
            setActiveProjectName(document.name);
            await refreshProjects();
            return document;
        } finally {
            setIsBusy(false);
        }
    }, [refreshProjects, saveProject]);

    const createNewProject = useCallback(async () => {
        setIsBusy(true);

        try {
            await saveProject();

            const nextProjects = await projectService.listProjects();
            const id = crypto.randomUUID();
            const name = createUniqueProjectName(nextProjects);
            const document = createDefaultProjectDocument({ id, name });

            await projectService.saveDocument(document);
            setActiveProjectId(id);
            setActiveProjectName(name);
            hydrateProjectDocument(document);
            writeActiveProjectId(id);
            await refreshProjects();
            await auditService.record({
                action: "project.created",
                entityType: "project",
                entityId: id
            });
            await trackEvent({
                event: "project.created",
                entityType: "project",
                entityId: id,
                metadata: { projectId: id, name }
            });
        } finally {
            setIsBusy(false);
        }
    }, [hydrateProjectDocument, projectService, refreshProjects, saveProject]);

    const createProjectFromTemplate = useCallback(async (templateId: string, name?: string) => {
        setIsBusy(true);

        try {
            await saveProject();

            const nextProjects = await projectService.listProjects();
            const document = await templateService.instantiateTemplate(templateId, {
                name: name ?? createUniqueProjectName(nextProjects)
            });

            const existing = await projectService.load(document.id);

            if (existing) {
                throw new Error("A project with this id already exists.");
            }

            await projectService.saveDocument(document);
            setActiveProjectId(document.id);
            setActiveProjectName(document.name);
            await hydrateProjectDocument(document);
            writeActiveProjectId(document.id);
            setIsManagerOpen(false);
            await refreshProjects();
            await auditService.record({
                action: "project.created",
                entityType: "project",
                entityId: document.id
            });
            const template = await getTemplate(templateId);
            await trackEvent({
                event: "project.created",
                entityType: "project",
                entityId: document.id,
                metadata: { projectId: document.id, name: document.name }
            });
            await trackEvent({
                event: "template.used",
                entityType: "template",
                entityId: templateId,
                metadata: {
                    label: template?.name ?? templateId,
                    projectId: document.id
                }
            });
        } finally {
            setIsBusy(false);
        }
    }, [hydrateProjectDocument, projectService, refreshProjects, saveProject]);

    const createTemplateFromCurrentProject = useCallback(async (metadata: {
        name: string;
        description: string;
        categoryId: string;
    }) => {
        setIsBusy(true);

        try {
            const document = await saveProject();
            await templateService.createTemplateFromProject(document, metadata);
        } finally {
            setIsBusy(false);
        }
    }, [saveProject]);

    const openProject = useCallback(async (projectId: string) => {
        if (projectId === activeProjectId) {
            setIsManagerOpen(false);
            return;
        }

        setIsBusy(true);

        try {
            await saveProject();

            const document = await projectService.load(projectId);

            if (!document) {
                console.warn(`Project "${projectId}" could not be loaded.`);
                return;
            }

            setActiveProjectId(document.id);
            setActiveProjectName(document.name);
            hydrateProjectDocument(document);
            writeActiveProjectId(document.id);
            setIsManagerOpen(false);
            await refreshProjects();
            await auditService.record({
                action: "project.opened",
                entityType: "project",
                entityId: document.id
            });
            await trackEvent({
                event: "project.opened",
                entityType: "project",
                entityId: document.id,
                metadata: { projectId: document.id, name: document.name }
            });
        } finally {
            setIsBusy(false);
        }
    }, [
        activeProjectId,
        hydrateProjectDocument,
        projectService,
        refreshProjects,
        saveProject
    ]);

    const deleteProject = useCallback(async (projectId: string) => {
        setIsBusy(true);

        try {
            await projectService.delete(projectId);
            await auditService.record({
                action: "project.deleted",
                entityType: "project",
                entityId: projectId
            });

            const remaining = await projectService.listProjects();
            setProjects(remaining);

            if (projectId !== activeProjectId) {
                return;
            }

            if (remaining.length > 0) {
                const nextProject = remaining[0]!;
                setActiveProjectId(nextProject.id);
                setActiveProjectName(nextProject.name);
                hydrateProjectDocument(nextProject);
                writeActiveProjectId(nextProject.id);
                return;
            }

            const document = createDefaultProjectDocument({
                id: crypto.randomUUID(),
                name: DEFAULT_PROJECT_NAME
            });

            await projectService.saveDocument(document);
            setActiveProjectId(document.id);
            setActiveProjectName(document.name);
            hydrateProjectDocument(document);
            writeActiveProjectId(document.id);
            await refreshProjects();
        } finally {
            setIsBusy(false);
        }
    }, [
        activeProjectId,
        hydrateProjectDocument,
        projectService,
        refreshProjects
    ]);

    const renameProject = useCallback(async (projectId: string, name: string) => {
        const trimmedName = name.trim();

        if (!trimmedName) {
            return;
        }

        setIsBusy(true);

        try {
            if (projectId === activeProjectId) {
                const document = await projectService.save(
                    activeProjectId,
                    selectPersistableEditorState(useEditorStore.getState()),
                    {
                        ...getMetadata(),
                        name: trimmedName
                    }
                );

                setMetadata(pickProjectDocumentMetadata(document));
                setActiveProjectName(document.name);
            } else {
                const existing = await projectService.load(projectId);

                if (!existing) {
                    return;
                }

                await projectService.saveDocument({
                    ...existing,
                    name: trimmedName
                });
            }

            await refreshProjects();
        } finally {
            setIsBusy(false);
        }
    }, [
        activeProjectId,
        getMetadata,
        projectService,
        refreshProjects,
        setMetadata
    ]);

    const saveRevision = useCallback(async (message?: string) => {
        let note = message;

        if (note === undefined) {
            const prompted = window.prompt(
                "Revision note (e.g. Approved, Customer requested changes):",
                ""
            );

            if (prompted === null) {
                return null;
            }

            note = prompted;
        }

        setIsBusy(true);

        try {
            const document = await saveProject();
            const { user } = getCloudStorageContext();
            const revision = await revisionService.createRevision(
                document,
                note,
                user?.email ?? user?.id ?? undefined
            );

            await auditService.record({
                action: "revision.created",
                entityType: "revision",
                entityId: revision.id
            });

            window.dispatchEvent(new Event("configurator:revision-saved"));
            return revision;
        } finally {
            setIsBusy(false);
        }
    }, [saveProject]);

    const restoreProjectRevision = useCallback(async (revisionId: string) => {
        setIsBusy(true);

        try {
            const document = await revisionService.restoreRevision(revisionId);
            hydrateProjectDocument(document);
            setActiveProjectName(document.name);
            await saveProject();
        } finally {
            setIsBusy(false);
        }
    }, [hydrateProjectDocument, saveProject]);

    const value = useMemo<ProjectSessionContextValue>(() => ({
        projects,
        activeProjectId,
        activeProjectName,
        isManagerOpen,
        isTemplateGalleryOpen,
        isBusy,
        openManager: () => setIsManagerOpen(true),
        closeManager: () => setIsManagerOpen(false),
        openTemplateGallery: () => setIsTemplateGalleryOpen(true),
        closeTemplateGallery: () => setIsTemplateGalleryOpen(false),
        refreshProjects,
        saveActiveProject,
        createNewProject,
        createProjectFromTemplate,
        createTemplateFromCurrentProject,
        openProject,
        deleteProject,
        renameProject,
        saveRevision,
        restoreProjectRevision
    }), [
        activeProjectId,
        activeProjectName,
        createNewProject,
        createProjectFromTemplate,
        createTemplateFromCurrentProject,
        deleteProject,
        isBusy,
        isManagerOpen,
        isTemplateGalleryOpen,
        openProject,
        projects,
        refreshProjects,
        renameProject,
        restoreProjectRevision,
        saveActiveProject,
        saveRevision
    ]);

    return (
        <ProjectSessionContext.Provider value={value}>
            {children}
        </ProjectSessionContext.Provider>
    );
}
