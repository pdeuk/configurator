import type { ReactNode } from "react";
import { useComponentRowAlign } from "./ComponentRowAlign";
import {
    LEFT_CHROME_OFFSET,
    RIGHT_CHROME_OFFSET
} from "./layout";

interface WorkspaceChromeProps {
    left: ReactNode;
    center?: ReactNode;
    right: ReactNode;
}

export function WorkspaceChrome({ left, center, right }: WorkspaceChromeProps) {
    const { top, height } = useComponentRowAlign();

    return (
        <div
            className="workspace-chrome"
            style={{
                top,
                height,
                left: LEFT_CHROME_OFFSET,
                right: RIGHT_CHROME_OFFSET
            }}
        >
            <div className="project-chrome-left">{left}</div>
            <div className="artwork-chrome-center">{center}</div>
            <div className="project-chrome-right">{right}</div>
        </div>
    );
}
