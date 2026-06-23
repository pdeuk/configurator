import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode
} from "react";
import { useEditorStore } from "../../store/editorStore";

interface PresentationModeContextValue {
    isPresentationMode: boolean;
    enterPresentationMode: () => void;
    exitPresentationMode: () => void;
}

const PresentationModeContext = createContext<PresentationModeContextValue | null>(null);

export function usePresentationMode() {
    const context = useContext(PresentationModeContext);

    if (!context) {
        throw new Error("usePresentationMode must be used within PresentationModeProvider.");
    }

    return context;
}

export function PresentationModeProvider({ children }: { children: ReactNode }) {
    const [isPresentationMode, setIsPresentationMode] = useState(false);
    const previousGridRef = useRef<boolean | null>(null);
    const setShowGrid = useEditorStore(state => state.setShowGrid);

    const enterPresentationMode = useCallback(() => {
        const { showGrid } = useEditorStore.getState();
        previousGridRef.current = showGrid;
        setShowGrid(false);
        setIsPresentationMode(true);
    }, [setShowGrid]);

    const exitPresentationMode = useCallback(() => {
        if (previousGridRef.current !== null) {
            setShowGrid(previousGridRef.current);
            previousGridRef.current = null;
        }

        setIsPresentationMode(false);
    }, [setShowGrid]);

    const value = useMemo(
        () => ({
            isPresentationMode,
            enterPresentationMode,
            exitPresentationMode
        }),
        [enterPresentationMode, exitPresentationMode, isPresentationMode]
    );

    return (
        <PresentationModeContext.Provider value={value}>
            {children}
        </PresentationModeContext.Provider>
    );
}
