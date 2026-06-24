import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode
} from "react";
import {
    CHROME_INLINE_ROW_HEIGHT,
    CHROME_ROW_TOP,
    TOOLBAR_PANEL_PADDING
} from "./layout";

interface ToolbarPanelMetrics {
    top: number;
    height: number;
}

interface ComponentRowAlignContextValue extends ToolbarPanelMetrics {
    registerToolbarPanel: (element: HTMLElement | null) => void;
    registerViewport: (element: HTMLElement | null) => void;
}

const FALLBACK_PANEL_HEIGHT =
    TOOLBAR_PANEL_PADDING * 2 + CHROME_INLINE_ROW_HEIGHT + 120;

const ComponentRowAlignContext = createContext<ComponentRowAlignContextValue>({
    top: CHROME_ROW_TOP,
    height: FALLBACK_PANEL_HEIGHT,
    registerToolbarPanel: () => undefined,
    registerViewport: () => undefined
});

export function ComponentRowAlignProvider({ children }: { children: ReactNode }) {
    const panelRef = useRef<HTMLElement | null>(null);
    const viewportRef = useRef<HTMLElement | null>(null);
    const cleanupRef = useRef<(() => void) | null>(null);
    const [metrics, setMetrics] = useState<ToolbarPanelMetrics>({
        top: CHROME_ROW_TOP,
        height: FALLBACK_PANEL_HEIGHT
    });

    const measure = useCallback(() => {
        const panel = panelRef.current;
        const viewport = viewportRef.current;

        if (!panel || !viewport) {
            return;
        }

        const panelRect = panel.getBoundingClientRect();
        const viewportRect = viewport.getBoundingClientRect();
        const top = panelRect.top - viewportRect.top;
        const height = panelRect.height;

        setMetrics({
            top,
            height
        });
    }, []);

    const scheduleMeasure = useCallback(() => {
        window.requestAnimationFrame(() => {
            measure();
        });
    }, [measure]);

    const bindObservers = useCallback(() => {
        cleanupRef.current?.();
        cleanupRef.current = null;

        const panel = panelRef.current;
        const viewport = viewportRef.current;

        scheduleMeasure();

        if (!panel || !viewport) {
            return;
        }

        const resizeObserver = new ResizeObserver(() => {
            scheduleMeasure();
        });

        resizeObserver.observe(panel);
        resizeObserver.observe(viewport);

        const scrollParents: HTMLElement[] = [];
        let parent = panel.parentElement;

        while (parent && parent !== viewport) {
            if (parent.scrollHeight > parent.clientHeight) {
                scrollParents.push(parent);
                parent.addEventListener("scroll", scheduleMeasure, { passive: true });
            }

            parent = parent.parentElement;
        }

        window.addEventListener("resize", scheduleMeasure);

        cleanupRef.current = () => {
            resizeObserver.disconnect();
            window.removeEventListener("resize", scheduleMeasure);

            for (const scrollParent of scrollParents) {
                scrollParent.removeEventListener("scroll", scheduleMeasure);
            }
        };
    }, [scheduleMeasure]);

    useEffect(() => {
        return () => {
            cleanupRef.current?.();
        };
    }, []);

    const registerToolbarPanel = useCallback((element: HTMLElement | null) => {
        panelRef.current = element;
        bindObservers();
    }, [bindObservers]);

    const registerViewport = useCallback((element: HTMLElement | null) => {
        viewportRef.current = element;
        bindObservers();
    }, [bindObservers]);

    const value = useMemo(
        () => ({
            ...metrics,
            registerToolbarPanel,
            registerViewport
        }),
        [metrics, registerToolbarPanel, registerViewport]
    );

    return (
        <ComponentRowAlignContext.Provider value={value}>
            {children}
        </ComponentRowAlignContext.Provider>
    );
}

export function useComponentRowAlign() {
    return useContext(ComponentRowAlignContext);
}
