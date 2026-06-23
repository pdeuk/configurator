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
    ARTWORK_LUMINOUS_COLOR,
    ARTWORK_RESTING_COLOR,
    GLOW_COLOR,
    PLAIN_FABRIC_COLOR,
    PLAIN_LUMINOUS_EMISSIVE_INTENSITY
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

    if (isBlockout) {
        return (
            <meshBasicMaterial
                map={texture}
                color={BLOCKOUT_FABRIC_COLOR}
                toneMapped={false}
                side={side}
            />
        );
    }

    return (
        <meshBasicMaterial
            map={texture}
            color={isLuminous ? ARTWORK_LUMINOUS_COLOR : ARTWORK_RESTING_COLOR}
            toneMapped={false}
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

    if (fabric.isBlockout) {
        return (
            <meshBasicMaterial
                color={BLOCKOUT_FABRIC_COLOR}
                toneMapped={false}
                side={side}
            />
        );
    }

    if (isLuminous) {
        return (
            <meshStandardMaterial
                color="#ffffff"
                emissive={GLOW_COLOR}
                emissiveIntensity={PLAIN_LUMINOUS_EMISSIVE_INTENSITY}
                roughness={0.9}
                metalness={0}
                toneMapped={false}
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
