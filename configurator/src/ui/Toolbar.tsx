import { useEditorStore } from "../store/editorStore";
import { createDefaultFabrics } from "../utils/fabrics";
import { DEFAULT_BANNER_SEGMENT_COUNT } from "../utils/bannerGeometry";


export function Toolbar() {
    const addModule = useEditorStore(state => state.addModule);
    const undo = useEditorStore(state => state.undo);
    const canUndo = useEditorStore(state => state.history.length > 0);

    return (
        <div
            style={{
                background: "#20242b",
                padding: 15,
                borderRadius: 8,
                color: "#f7f7f2",
                border: "1px solid #3b414a",
                boxShadow: "0 12px 30px rgba(0, 0, 0, 0.22)",
                fontFamily: "system-ui, sans-serif",
                display: "grid",
                gap: 8
            }}
        >
            <h3 style={{ margin: 0 }}>
                Components
            </h3>

            <button
                type="button"
                style={styles.button}
                onClick={() => {
                    const count = useEditorStore.getState().moduleIds.length;

                    addModule({
                        id: `wall-${crypto.randomUUID()}`,
                        type: "wall",
                        position: {
                            x: count * 1.25,
                            y: 0,
                            z: 0
                        },
                        rotation: 0,
                        width: 1,
                        height: 2,
                        depth: 0.05,
                        fabrics: createDefaultFabrics("wall")
                    });
                }}
            >
                Add Frame (100x200)
            </button>

            <button
                type="button"
                style={styles.button}
                onClick={() => {
                    const count = useEditorStore.getState().moduleIds.length;

                    addModule({
                        id: `cube-${crypto.randomUUID()}`,
                        type: "cube",
                        position: {
                            x: count * 0.75,
                            y: 0,
                            z: 0.75
                        },
                        rotation: 0,
                        width: 0.5,
                        height: 0.5,
                        depth: 0.5,
                        fabrics: createDefaultFabrics("cube")
                    });
                }}
            >
                Add Cube (50x50x50)
            </button>

            <button
                type="button"
                style={styles.button}
                onClick={() => {
                    const count = useEditorStore.getState().moduleIds.length;

                    addModule({
                        id: `banner-${crypto.randomUUID()}`,
                        type: "circularBanner",
                        position: {
                            x: count * 0.9,
                            y: 0,
                            z: 0.9
                        },
                        rotation: 0,
                        width: 1.2,
                        height: 2,
                        depth: 0.08,
                        segmentCount: DEFAULT_BANNER_SEGMENT_COUNT,
                        fabrics: createDefaultFabrics(
                            "circularBanner",
                            DEFAULT_BANNER_SEGMENT_COUNT
                        )
                    });
                }}
            >
                Add Hanging Banner (Circular)
            </button>

            <button
                type="button"
                style={{
                    ...styles.button,
                    opacity: canUndo ? 1 : 0.45,
                    cursor: canUndo ? "pointer" : "not-allowed"
                }}
                disabled={!canUndo}
                onClick={undo}
            >
                Undo
            </button>
        </div>
    );
}

const styles = {
    button: {
        border: "1px solid #4b5562",
        background: "#2d3440",
        color: "#f7f7f2",
        borderRadius: 6,
        padding: "8px 10px",
        cursor: "pointer",
        font: "inherit",
        fontSize: 13
    }
} satisfies Record<string, import("react").CSSProperties>;
