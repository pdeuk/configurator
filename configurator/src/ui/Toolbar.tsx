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
                zIndex: 10
            }}
        >
            <h3>
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
                        fabrics: createDefaultFabrics()
                    });
                }}
            >
                Add Wall
            </button>

            <button
                type="button"
                disabled={!canUndo}
                onClick={undo}
                style={{
                    marginLeft: 8,
                    opacity: canUndo ? 1 : 0.45,
                    cursor: canUndo ? "pointer" : "not-allowed"
                }}
            >
                Undo
            </button>
        </div>
    );
}
