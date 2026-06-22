import { useLoader } from "@react-three/fiber";
import {
    BackSide,
    FrontSide,
    TextureLoader,
    type Side
} from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";
import { BLOCKOUT_FABRIC_COLOR } from "../utils/fabrics";
import {
    BLOCKOUT_ARTWORK_COLOR,
    LUMINOUS_EMISSIVE_INTENSITY,
    LUMINOUS_ARTWORK_ROUGHNESS,
    LUMINOUS_TRANSMISSION,
    PLAIN_FABRIC_COLOR,
    PLAIN_LUMINOUS_EMISSIVE_INTENSITY,
    PLAIN_LUMINOUS_TRANSMISSION,
    LUMINOUS_PLAIN_ROUGHNESS
} from "./fabricLuminous";

interface FabricArtworkMaterialProps {
    imageUrl: string;
    isBlockout: boolean;
    isLuminous: boolean;
    side?: Side;
}

export function FabricArtworkMaterial({
    imageUrl,
    isBlockout,
    isLuminous,
    side = FrontSide
}: FabricArtworkMaterialProps) {
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
                roughness={LUMINOUS_ARTWORK_ROUGHNESS}
                metalness={0}
                side={side}
            />
        );
    }

    return (
        <meshStandardMaterial
            color={isBlockout ? BLOCKOUT_ARTWORK_COLOR : "white"}
            map={texture}
            roughness={0.95}
            metalness={0}
            side={side}
        />
    );
}

interface FabricFaceMaterialProps {
    fabric: FabricInfo;
    artwork: ArtworkInfo | null;
    isLuminous: boolean;
    side?: Side;
}

export function FabricFaceMaterial({
    fabric,
    artwork,
    isLuminous,
    side = FrontSide
}: FabricFaceMaterialProps) {
    const plainFabricColor = fabric.isBlockout ? BLOCKOUT_FABRIC_COLOR : PLAIN_FABRIC_COLOR;

    if (artwork) {
        return (
            <FabricArtworkMaterial
                imageUrl={artwork.imageUrl}
                isBlockout={fabric.isBlockout}
                isLuminous={isLuminous}
                side={side}
            />
        );
    }

    if (isLuminous) {
        return (
            <meshPhysicalMaterial
                color={plainFabricColor}
                emissive={plainFabricColor}
                emissiveIntensity={PLAIN_LUMINOUS_EMISSIVE_INTENSITY}
                transmission={PLAIN_LUMINOUS_TRANSMISSION}
                thickness={0.02}
                ior={1.35}
                attenuationColor="#fff8ec"
                attenuationDistance={1.2}
                roughness={LUMINOUS_PLAIN_ROUGHNESS}
                metalness={0}
                side={side}
            />
        );
    }

    return (
        <meshStandardMaterial
            color={plainFabricColor}
            roughness={0.95}
            metalness={0}
            side={side}
        />
    );
}

export { BackSide, FrontSide };
