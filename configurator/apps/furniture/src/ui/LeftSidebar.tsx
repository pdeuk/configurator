import { useState, type CSSProperties } from "react";
import { ComponentLibraryPanel } from "./catalog";
import { MockupPanel } from "./MockupPanel";
import { Toolbar } from "./Toolbar";
import {
    CHROME_ROW_TOP,
    PANEL_INSET,
    PANEL_SECTION_GAP,
    SIDEBAR_PANEL_WIDTH
} from "./shell/layout";

interface LeftSidebarProps {
    floorOnly?: boolean;
    onExit?: () => void;
    libraryOpen?: boolean;
    mockupsOpen?: boolean;
    onLibraryOpenChange?: (open: boolean) => void;
    onMockupsOpenChange?: (open: boolean) => void;
}

export function LeftSidebar({
    floorOnly = false,
    onExit,
    libraryOpen: libraryOpenProp,
    mockupsOpen: mockupsOpenProp,
    onLibraryOpenChange,
    onMockupsOpenChange
}: LeftSidebarProps) {
    const [libraryOpenLocal, setLibraryOpenLocal] = useState(false);
    const [mockupsOpenLocal, setMockupsOpenLocal] = useState(false);

    const libraryOpen = libraryOpenProp ?? libraryOpenLocal;
    const mockupsOpen = mockupsOpenProp ?? mockupsOpenLocal;

    const setLibraryOpen = (open: boolean) => {
        onLibraryOpenChange?.(open);
        if (libraryOpenProp === undefined) {
            setLibraryOpenLocal(open);
        }
    };

    const setMockupsOpen = (open: boolean) => {
        onMockupsOpenChange?.(open);
        if (mockupsOpenProp === undefined) {
            setMockupsOpenLocal(open);
        }
    };

    return (
        <div style={styles.sidebar}>
            <Toolbar floorOnly={floorOnly} />
            {!floorOnly && (
                <>
                    <button
                        type="button"
                        style={styles.toggle}
                        onClick={() => setLibraryOpen(!libraryOpen)}
                        aria-expanded={libraryOpen}
                    >
                        {libraryOpen ? "Hide component library" : "Component library"}
                    </button>
                    {libraryOpen && <ComponentLibraryPanel />}
                    <button
                        type="button"
                        style={styles.toggle}
                        onClick={() => setMockupsOpen(!mockupsOpen)}
                        aria-expanded={mockupsOpen}
                    >
                        {mockupsOpen ? "Hide mockups" : "Mockups & print preview"}
                    </button>
                    {mockupsOpen && <MockupPanel />}
                </>
            )}
            {floorOnly && onExit && (
                <button type="button" style={styles.exitButton} onClick={onExit}>
                    Exit
                </button>
            )}
        </div>
    );
}

const styles = {
    sidebar: {
        position: "absolute",
        top: CHROME_ROW_TOP,
        left: PANEL_INSET,
        bottom: PANEL_INSET,
        width: `min(${SIDEBAR_PANEL_WIDTH}px, calc(100vw - ${PANEL_INSET * 2}px))`,
        display: "flex",
        flexDirection: "column",
        gap: PANEL_SECTION_GAP,
        zIndex: 10,
        minHeight: 0,
        minWidth: 0,
        boxSizing: "border-box",
        overflowY: "auto"
    },
    toggle: {
        flexShrink: 0,
        border: "1px solid #4b5562",
        background: "#252932",
        color: "#cbd5e1",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 12,
        textAlign: "left"
    },
    exitButton: {
        marginTop: "auto",
        flexShrink: 0,
        border: "1px solid #64748b",
        background: "#334155",
        color: "#f7f7f2",
        borderRadius: 8,
        padding: "10px 12px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13,
        fontWeight: 600
    }
} satisfies Record<string, CSSProperties>;
