import { useEditorStore } from "../store/editorStore";
import { WallFrame } from "./WallFrame";
import { getFrameConnectionLayout } from "./frameConnections";
import type { StandModule } from "../models/ModuleModel";

function isStandModule(module: StandModule | undefined): module is StandModule {
    return module !== undefined;
}

export function SnapPreview() {
    const position = useEditorStore(state => state.snapPosition);
    const selectedId = useEditorStore(state => state.selectedId);
    const moduleIds = useEditorStore(state => state.moduleIds);
    const modulesById = useEditorStore(state => state.modulesById);
    const selectedModule = useEditorStore(state =>
        selectedId ? state.modulesById[selectedId] : undefined
    );

    if (!position || !selectedModule) {
        return null;
    }

    const modules = moduleIds
        .map(id => modulesById[id])
        .filter(isStandModule);
    const previewModule = {
        ...selectedModule,
        position
    };
    const connectionLayout = getFrameConnectionLayout(previewModule, modules);

    return (
        <mesh
            position={[
                position.x,
                position.y + selectedModule.height / 2,
                position.z
            ]}
            rotation={[0, selectedModule.rotation, 0]}
        >
            <WallFrame
                module={previewModule}
                color="#ff4db8"
                opacity={0.65}
                wireframe
                hiddenSides={connectionLayout.hiddenSides}
            />
        </mesh>
    );
}
