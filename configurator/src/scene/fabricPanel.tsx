import { useLoader } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { useMemo } from "react";
import {
    AdditiveBlending,
    CanvasTexture,
    FrontSide,
    TextureLoader
} from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";

const PLAIN_FABRIC_COLOR = "#d8d2c4";
const BLOCKOUT_FABRIC_COLOR = "#6a6a6a";
const BACKLIGHT_COLOR = "#fff3df";
const BACKLIGHT_INTENSITY = 8.5;
const LUMINOUS_EMISSIVE_INTENSITY = 0.28;
const LUMINOUS_TRANSMISSION = 0.32;
const GLOW_COLOR = "#ffe9c8";
const GLOW_OPACITY = 0.26;
const GLOW_SCALE = 1.12;

let fabricGlowTexture: CanvasTexture | null = null;

function getFabricGlowTexture() {
    if (fabricGlowTexture) {
        return fabricGlowTexture;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to create fabric glow texture.");
    }

    const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255, 245, 220, 0.95)");
    gradient.addColorStop(0.42, "rgba(255, 225, 175, 0.35)");
    gradient.addColorStop(1, "rgba(255, 225, 175, 0)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 256);

    fabricGlowTexture = new CanvasTexture(canvas);
    return fabricGlowTexture;
}

interface ArtworkMaterialProps {
    imageUrl: string;
    isBlockout: boolean;
    isLuminous: boolean;
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

export interface FabricPanelProps {
    fabric: FabricInfo;
    artwork: ArtworkInfo | null;
    panelWidth: number;
    panelHeight: number;
    position: [number, number, number];
    rotation: [number, number, number];
    backlightPosition: [number, number, number];
    backlightRotation: [number, number, number];
    glowPosition: [number, number, number];
    glowRotation: [number, number, number];
}

export function FabricPanel({
    fabric,
    artwork,
    panelWidth,
    panelHeight,
    position,
    rotation,
    backlightPosition,
    backlightRotation,
    glowPosition,
    glowRotation
}: FabricPanelProps) {
    const glowTexture = useMemo(() => getFabricGlowTexture(), []);
    const plainFabricColor = fabric.isBlockout ? BLOCKOUT_FABRIC_COLOR : PLAIN_FABRIC_COLOR;
    const isLuminous = fabric.isLuminous && !fabric.isBlockout;

    return (
        <>
            {isLuminous && (
                <>
                    <rectAreaLight
                        width={panelWidth * 0.96}
                        height={panelHeight * 0.96}
                        intensity={BACKLIGHT_INTENSITY}
                        color={BACKLIGHT_COLOR}
                        position={backlightPosition}
                        rotation={backlightRotation}
                    />
                    <mesh
                        position={glowPosition}
                        rotation={glowRotation}
                        raycast={() => null}
                    >
                        <planeGeometry args={[panelWidth * GLOW_SCALE, panelHeight * GLOW_SCALE]} />
                        <meshBasicMaterial
                            map={glowTexture}
                            color={GLOW_COLOR}
                            transparent
                            opacity={GLOW_OPACITY}
                            blending={AdditiveBlending}
                            depthWrite={false}
                            toneMapped={false}
                            side={FrontSide}
                        />
                    </mesh>
                </>
            )}
            <mesh
                position={position}
                rotation={rotation}
                onPointerDown={(event: ThreeEvent<PointerEvent>) => {
                    event.stopPropagation();
                }}
            >
                <planeGeometry args={[panelWidth, panelHeight]} />
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
