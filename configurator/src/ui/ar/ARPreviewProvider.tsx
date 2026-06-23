import { createContext, useContext, useRef, useState, type ReactNode } from "react";
import { ARScene } from "../../scene/ARScene";
import { exitAR } from "../../services/ar";
import { useEditorStore } from "../../store/editorStore";

interface ARPreviewContextValue {
    isOpen: boolean;
    openARPreview: () => void;
    closeARPreview: () => void;
}

const ARPreviewContext = createContext<ARPreviewContextValue | null>(null);

export function ARPreviewProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const previousReadOnlyRef = useRef(false);

    const openARPreview = () => {
        previousReadOnlyRef.current = useEditorStore.getState().readOnly;
        useEditorStore.getState().setReadOnly(true);
        setIsOpen(true);
    };

    const closeARPreview = () => {
        exitAR();
        useEditorStore.getState().setReadOnly(previousReadOnlyRef.current);
        setIsOpen(false);
    };

    return (
        <ARPreviewContext.Provider
            value={{
                isOpen,
                openARPreview,
                closeARPreview
            }}
        >
            {children}
            {isOpen && <ARScene onExit={closeARPreview} />}
        </ARPreviewContext.Provider>
    );
}

export function useARPreview(): ARPreviewContextValue {
    const context = useContext(ARPreviewContext);

    if (!context) {
        throw new Error("useARPreview must be used within ARPreviewProvider.");
    }

    return context;
}

export function useOptionalARPreview(): ARPreviewContextValue | null {
    return useContext(ARPreviewContext);
}
