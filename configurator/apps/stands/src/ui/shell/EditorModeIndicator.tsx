import { useEditorStore } from "../../store/editorStore";
import { useARPreview } from "../ar";
import { useAppShell } from "./AppShellProvider";
import { usePresentationMode } from "../presentation/PresentationModeContext";

function resolveModeLabel(input: {
    isPresentationMode: boolean;
    artworkEditMode: boolean;
    isARPreviewOpen: boolean;
    reviewsVisible: boolean;
}): string {
    if (input.isPresentationMode) {
        return "Presentation Mode";
    }

    if (input.isARPreviewOpen) {
        return "AR Preview";
    }

    if (input.artworkEditMode) {
        return "Artwork Mode";
    }

    if (input.reviewsVisible) {
        return "Review Mode";
    }

    return "Design Mode";
}

export function EditorModeIndicator() {
    const artworkEditMode = useEditorStore(state => state.artworkEditMode);
    const { isOpen: isARPreviewOpen } = useARPreview();
    const { reviewsVisible } = useAppShell();
    const { isPresentationMode } = usePresentationMode();

    const label = resolveModeLabel({
        isPresentationMode,
        artworkEditMode: artworkEditMode !== null,
        isARPreviewOpen,
        reviewsVisible
    });

    return (
        <span style={styles.badge} title="Current editor mode">
            {label}
        </span>
    );
}

const styles = {
    badge: {
        fontSize: 11,
        fontWeight: 600,
        color: "#dbeafe",
        border: "1px solid #3b82f6",
        borderRadius: 999,
        padding: "5px 10px",
        background: "rgba(30, 58, 95, 0.55)",
        whiteSpace: "nowrap"
    }
} satisfies Record<string, import("react").CSSProperties>;
