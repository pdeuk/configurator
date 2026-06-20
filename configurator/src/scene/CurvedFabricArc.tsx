import { useLoader } from "@react-three/fiber";
import { useMemo } from "react";
import {
    AdditiveBlending,
    BackSide,
    CanvasTexture,
    DoubleSide,
    FrontSide,
    TextureLoader
} from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";
import { BLOCKOUT_FABRIC_COLOR } from "../utils/fabrics";
import { ignoreRaycast } from "./raycast";

const PLAIN_FABRIC_COLOR = "#d8d2c4";
const GLOW_COLOR = "#ffe9c8";
const GLOW_OPACITY = 0.26;
const LUMINOUS_EMISSIVE_INTENSITY = 0.28;
const LUMINOUS_TRANSMISSION = 0.32;

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
    side?: typeof FrontSide | typeof BackSide | typeof DoubleSide;
}

function ArtworkMaterial({
    imageUrl,
    isBlockout,
    isLuminous,
    side = FrontSide
}: ArtworkMaterialProps) {
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
                side={side}
            />
        );
    }

    return (
        <meshStandardMaterial
            color={isBlockout ? "#e5e0d2" : "white"}
            map={texture}
            roughness={0.95}
            metalness={0}
            side={side}
        />
    );
}

export interface CurvedFabricArcProps {
    fabric: FabricInfo;
    artwork: ArtworkInfo | null;
    radius: number;
    height: number;
    thetaStart: number;
    thetaLength: number;
    inward?: boolean;
}

export function CurvedFabricArc({
    fabric,
    artwork,
    radius,
    height,
    thetaStart,
    thetaLength,
    inward = false
}: CurvedFabricArcProps) {
    const glowTexture = useMemo(() => getFabricGlowTexture(), []);
    const plainFabricColor = fabric.isBlockout ? BLOCKOUT_FABRIC_COLOR : PLAIN_FABRIC_COLOR;
    const isLuminous = fabric.isLuminous && !fabric.isBlockout;
    const radialSegments = Math.max(12, Math.ceil(thetaLength * 32));
    const materialSide = inward ? BackSide : FrontSide;

    return (
        <>
            {isLuminous && (
                <mesh raycast={ignoreRaycast}>
                    <cylinderGeometry
                        args={[
                            radius * 1.01,
                            radius * 1.01,
                            height * 0.98,
                            radialSegments,
                            1,
                            true,
                            thetaStart,
                            thetaLength
                        ]}
                    />
                    <meshBasicMaterial
                        map={glowTexture}
                        color={GLOW_COLOR}
                        transparent
                        opacity={GLOW_OPACITY}
                        blending={AdditiveBlending}
                        depthWrite={false}
                        toneMapped={false}
                        side={DoubleSide}
                    />
                </mesh>
            )}
            <mesh raycast={ignoreRaycast}>
                <cylinderGeometry
                    args={[
                        radius,
                        radius,
                        height,
                        radialSegments,
                        1,
                        true,
                        thetaStart,
                        thetaLength
                    ]}
                />
                {artwork ? (
                    <ArtworkMaterial
                        imageUrl={artwork.imageUrl}
                        isBlockout={fabric.isBlockout}
                        isLuminous={isLuminous}
                        side={materialSide}
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
                        side={materialSide}
                    />
                ) : (
                    <meshStandardMaterial
                        color={plainFabricColor}
                        roughness={0.95}
                        metalness={0}
                        side={materialSide}
                    />
                )}
            </mesh>
        </>
    );
}
