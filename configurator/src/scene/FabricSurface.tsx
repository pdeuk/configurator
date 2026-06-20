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

const PLAIN_FABRIC_COLOR = "#d8d2c4";
const BLOCKOUT_FABRIC_COLOR = "#6a6a6a";
const BACKLIGHT_COLOR = "#fff3df";
const BACKLIGHT_INTENSITY = 6;
const BACKLIGHT_OFFSET = 0.045;
const LUMINOUS_EMISSIVE_INTENSITY = 0.22;
const LUMINOUS_TRANSMISSION = 0.32;

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
    isLuminous: boolean;
}

interface FabricBacklightProps {
    side: FabricSide;
    width: number;
    height: number;
    centerOffsetX: number;
    zOffset: number;
}

function FabricBacklight({
    side,
    width,
    height,
    centerOffsetX,
    zOffset
}: FabricBacklightProps) {
    const positionZ = side === "front"
        ? zOffset + BACKLIGHT_OFFSET
        : zOffset - BACKLIGHT_OFFSET;
    const rotation: [number, number, number] = side === "front"
        ? [0, 0, 0]
        : [0, Math.PI, 0];

    return (
        <rectAreaLight
            width={width * 0.96}
            height={height * 0.96}
            intensity={BACKLIGHT_INTENSITY}
            color={BACKLIGHT_COLOR}
            position={[centerOffsetX, 0, positionZ]}
            rotation={rotation}
        />
    );
}

function ArtworkMaterial({ imageUrl, isBlockout, isLuminous }: ArtworkMaterialProps) {
    const texture = useLoader(TextureLoader, imageUrl);

    if (isLuminous && !isBlockout) {
        return (
            <meshPhysicalMaterial
                map={texture}
                color="#ffffff"
                emissiveMap={texture}
                emissive="#ffffff"
                emissiveIntensity={LUMINOUS_EMISSIVE_INTENSITY}
                transmission={LUMINOUS_TRANSMISSION}
                thickness={0.02}
                ior={1.35}
                attenuationColor="#fff8ec"
                attenuationDistance={1.2}
                roughness={0.78}
                metalness={0}
                side={FrontSide}
            />
        );
    }

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
    const plainFabricColor = fabric.isBlockout ? BLOCKOUT_FABRIC_COLOR : PLAIN_FABRIC_COLOR;
    const isLuminous = fabric.isLuminous && !fabric.isBlockout;

    return (
        <>
            {isLuminous && (
                <FabricBacklight
                    side={side}
                    width={layout.width}
                    height={module.height}
                    centerOffsetX={layout.centerOffsetX}
                    zOffset={zOffset}
                />
            )}
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
                        isLuminous={isLuminous}
                    />
                ) : isLuminous ? (
                    <meshPhysicalMaterial
                        color={plainFabricColor}
                        emissive={plainFabricColor}
                        emissiveIntensity={0.35}
                        transmission={0.4}
                        thickness={0.02}
                        ior={1.35}
                        attenuationColor="#fff8ec"
                        attenuationDistance={1.2}
                        roughness={0.82}
                        metalness={0}
                        side={FrontSide}
                    />
                ) : (
                    <meshStandardMaterial
                        color={plainFabricColor}
                        roughness={0.95}
                        metalness={0}
                        side={FrontSide}
                    />
                )}
            </mesh>
        </>
    );
}
