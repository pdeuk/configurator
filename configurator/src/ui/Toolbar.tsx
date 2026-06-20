import { useEditorStore } from "../store/editorStore";
import { createDefaultFabrics } from "../utils/fabrics";


export function Toolbar() {
    const addModule = useEditorStore(state => state.addModule);
    const undo = useEditorStore(state => state.undo);
    const canUndo = useEditorStore(state => state.history.length > 0);

    return (
        <div
            style={{
                position: "absolute",
                top: 20,
                left: 20,
                background: "#222",
                padding: 15,
                borderRadius: 8,
                color: "white",
                zIndex: 10,
                display: "grid",
                gap: 8
            }}
        >
            <h3 style={{ margin: 0 }}>
                Components
            </h3>

            <button
                type="button"
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
                disabled={!canUndo}
                onClick={undo}
                style={{
                    opacity: canUndo ? 1 : 0.45,
                    cursor: canUndo ? "pointer" : "not-allowed"
                }}
            >
                Undo
            </button>
        </div>
    );
}
