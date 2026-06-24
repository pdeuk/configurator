import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ProjectDocument } from "../models/ProjectModel";
import { hydrateModulesArtwork } from "../lib/artworkAssetHydration";
import {
    DEFAULT_PROJECT_ID,
    DEFAULT_PROJECT_NAME,
    PROJECT_SAVE_DEBOUNCE_MS
} from "../lib/projectConstants";
import {
    pickProjectDocumentMetadata,
    readProjectDocumentOrDefault,
    writeActiveProjectId
} from "../lib/projectPersistence";
import { selectPersistableEditorState, projectDocumentToPersistableState } from "../lib/projectSerialization";
import {
    ProjectService,
    type ProjectDocumentMetadata
} from "../services/ProjectService";
import { getProjectStorage } from "../services/cloud";
import {
    errorTrackingService,
    loadingStateService,
    performanceService
} from "../services/system";
import { useEditorStore } from "../store/editorStore";

interface UseProjectPersistenceOptions {
    projectId?: string;
    projectName?: string;
    onHydrated?: (document: ProjectDocument) => void;
}

function serializePersistableState(state: ReturnType<typeof useEditorStore.getState>): string {
    return JSON.stringify(selectPersistableEditorState(state));
}

export function useProjectPersistence({
    projectId = DEFAULT_PROJECT_ID,
    projectName = DEFAULT_PROJECT_NAME,
    onHydrated
}: UseProjectPersistenceOptions = {}) {
    const projectService = useMemo(
        () => new ProjectService(getProjectStorage()),
        []
    );
    const loadProjectDocument = useEditorStore(state => state.loadProjectDocument);
    const metadataRef = useRef<ProjectDocumentMetadata>(
        pickProjectDocumentMetadata(readProjectDocumentOrDefault(projectId, projectName))
    );
    const hydrationCompleteRef = useRef(false);
    const lastSavedSnapshotRef = useRef<string | null>(null);
    const onHydratedRef = useRef(onHydrated);

    onHydratedRef.current = onHydrated;

    const applyHydratedDocument = async (document: ProjectDocument) => {
        const persistableState = projectDocumentToPersistableState(document);
        loadingStateService.begin("assets");

        let modulesById;

        try {
            modulesById = await performanceService.measureAsync(
                "assets.load",
                () => hydrateModulesArtwork(persistableState.modulesById),
                { projectId: document.id }
            );
        } finally {
            loadingStateService.end("assets");
        }

        loadProjectDocument(document);
        useEditorStore.setState({ modulesById });
        metadataRef.current = pickProjectDocumentMetadata(document);
        lastSavedSnapshotRef.current = serializePersistableState(
            useEditorStore.getState()
        );
        writeActiveProjectId(document.id);
        onHydratedRef.current?.(document);
    };

    useLayoutEffect(() => {
        hydrationCompleteRef.current = false;
        let cancelled = false;

        void (async () => {
            loadingStateService.begin("project");
            const startedAt = performance.now();

            try {
                const document = readProjectDocumentOrDefault(projectId, projectName);

                if (!cancelled) {
                    await applyHydratedDocument(document);
                    performanceService.recordProjectLoad(
                        Math.round(performance.now() - startedAt),
                        document.id
                    );
                }
            } catch (error) {
                errorTrackingService.captureError(error, {
                    context: "project.hydration"
                });
                console.warn("Project hydration failed; using default stand.", error);

                if (!cancelled) {
                    const fallback = readProjectDocumentOrDefault(projectId, projectName);
                    await applyHydratedDocument(fallback);
                }
            } finally {
                loadingStateService.end("project");

                if (!cancelled) {
                    hydrationCompleteRef.current = true;
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [loadProjectDocument, projectId, projectName]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout> | undefined;

        const unsubscribe = useEditorStore.subscribe(state => {
            if (!hydrationCompleteRef.current) {
                return;
            }

            const snapshot = serializePersistableState(state);

            if (snapshot === lastSavedSnapshotRef.current) {
                return;
            }

            clearTimeout(timeout);
            timeout = setTimeout(() => {
                void (async () => {
                    try {
                        const document = await projectService.save(
                            projectId,
                            selectPersistableEditorState(state),
                            metadataRef.current
                        );

                        metadataRef.current = pickProjectDocumentMetadata(document);
                        lastSavedSnapshotRef.current = serializePersistableState(
                            useEditorStore.getState()
                        );
                    } catch (error) {
                        errorTrackingService.captureError(error, {
                            context: "project.auto-save"
                        });
                        console.warn("Project auto-save failed.", error);
                    }
                })();
            }, PROJECT_SAVE_DEBOUNCE_MS);
        });

        return () => {
            clearTimeout(timeout);
            unsubscribe();
        };
    }, [projectId, projectService]);

    const saveProject = async (): Promise<ProjectDocument> => {
        const state = useEditorStore.getState();
        const document = await projectService.save(
            projectId,
            selectPersistableEditorState(state),
            metadataRef.current
        );

        metadataRef.current = pickProjectDocumentMetadata(document);
        lastSavedSnapshotRef.current = serializePersistableState(
            useEditorStore.getState()
        );

        return document;
    };

    const hydrateProjectDocument = async (document: ProjectDocument) => {
        hydrationCompleteRef.current = false;
        loadingStateService.begin("project");
        const startedAt = performance.now();

        try {
            await applyHydratedDocument(document);
            performanceService.recordProjectLoad(
                Math.round(performance.now() - startedAt),
                document.id
            );
        } finally {
            loadingStateService.end("project");
            hydrationCompleteRef.current = true;
        }
    };

    return {
        projectService,
        saveProject,
        hydrateProjectDocument,
        getMetadata: () => metadataRef.current,
        setMetadata: (metadata: ProjectDocumentMetadata) => {
            metadataRef.current = metadata;
        }
    };
}
