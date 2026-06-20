import { useLoader } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
    FrontSide,
    TextureLoader
} from "three";
import type {
    FabricSide,
    StandModule
} from "../models/ModuleModel";
import {
    FABRIC_SIDES,
    getMergedFabric,
    getMergedFabricArtwork
} from "../utils/fabrics";
import type { FabricMergeLayout } from "./frameConnections";

interface FabricSurfaceProps {
    module: StandModule;
    connectionLayout: FabricMergeLayout;
}

interface FabricFaceProps {
    side: FabricSide;
    module: StandModule;
    layout: FabricMergeLayout;
}

interface ArtworkMaterialProps {
    imageUrl: string;
    isBlockout: boolean;
}

function ArtworkMaterial({ imageUrl, isBlockout }: ArtworkMaterialProps) {
    const texture = useLoader(TextureLoader, imageUrl);

    return (
        <meshStandardMaterial
            color={isBlockout ? "#e5e0d2" : "white"}
            map={texture}
            roughness={0.95}
            metalness={0}
            side={FrontSide}
        />
    );
}

function stopFabricPointerPropagation(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
}

export function FabricSurface({
    module,
    connectionLayout
}: FabricSurfaceProps) {
    if (!connectionLayout.isLeader) {
        return null;
    }

    return (
        <>
            {FABRIC_SIDES.map(side => (
                <FabricFace
                    key={side}
                    side={side}
                    module={module}
                    layout={connectionLayout}
                />
            ))}
        </>
    );
}

function FabricFace({
    side,
    module,
    layout
}: FabricFaceProps) {
    const fabric = getMergedFabric(side, layout.members);
    const zOffset = side === "front"
        ? -module.depth / 2 - 0.003
        : module.depth / 2 + 0.003;
    const artwork = getMergedFabricArtwork(
        side,
        module,
        layout.members,
        layout.width
    );

    return (
        <mesh
            position={[layout.centerOffsetX, 0, zOffset]}
            rotation={[0, side === "front" ? Math.PI : 0, 0]}
            onPointerDown={stopFabricPointerPropagation}
        >
            <planeGeometry args={[layout.width, module.height]} />
            {artwork ? (
                <ArtworkMaterial
                    imageUrl={artwork.imageUrl}
                    isBlockout={fabric.isBlockout}
                />
            ) : (
                <meshStandardMaterial
                    color={fabric.isBlockout ? "#6a6a6a" : "#d8d2c4"}
                    roughness={0.95}
                    metalness={0}
                    side={FrontSide}
                />
            )}
        </mesh>
    );
}
