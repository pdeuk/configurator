import { createContext, useContext, useState, type ReactNode } from "react";

interface MobileDrawerContextValue {
    close: () => void;
}

const MobileDrawerContext = createContext<MobileDrawerContextValue>({
    close: () => undefined
});

/** Lets drawer content (e.g. action buttons) collapse the drawer after acting. */
export function useMobileDrawer() {
    return useContext(MobileDrawerContext);
}

interface MobileChromeProps {
    children: ReactNode;
}

/**
 * Phone-only slide-in drawer shell: a floating hamburger opens a left drawer
 * that hosts the workspace controls. Mounted by the Configurator only on
 * phone-sized viewports, so desktop is never affected.
 */
export function MobileChrome({ children }: MobileChromeProps) {
    const [isOpen, setIsOpen] = useState(false);
    const close = () => setIsOpen(false);

    return (
        <MobileDrawerContext.Provider value={{ close }}>
            {!isOpen && (
                <button
                    type="button"
                    className="mobile-chrome-toggle"
                    aria-label="Open controls"
                    aria-expanded={isOpen}
                    onClick={() => setIsOpen(true)}
                >
                    <span aria-hidden="true">☰</span>
                </button>
            )}
            {isOpen && (
                <button
                    type="button"
                    className="mobile-chrome-backdrop"
                    aria-label="Close controls"
                    onClick={close}
                />
            )}
            <aside
                className={`mobile-chrome-drawer${isOpen ? " is-open" : ""}`}
                aria-hidden={!isOpen}
            >
                <div className="mobile-chrome-drawer-header">
                    <span className="mobile-chrome-drawer-title">Controls</span>
                    <button
                        type="button"
                        className="mobile-chrome-close"
                        aria-label="Close controls"
                        onClick={close}
                    >
                        <span aria-hidden="true">✕</span>
                    </button>
                </div>
                <div className="mobile-chrome-drawer-body">{children}</div>
            </aside>
        </MobileDrawerContext.Provider>
    );
}
