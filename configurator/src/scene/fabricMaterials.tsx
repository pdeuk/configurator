import { useEffect, useState } from "react";
import { useLoader } from "@react-three/fiber";
import {
    BackSide,
    FrontSide,
    TextureLoader,
    type Side
} from "three";
import type { ArtworkInfo, FabricInfo } from "../models/ModuleModel";
import {
    MISSING_ARTWORK_DATA_URL,
    resolveArtworkDisplayUrl
} from "../lib/artworkAssetHydration";
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

function FabricArtworkMaterialInner({
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

function useResolvedArtworkImageUrl(artwork: ArtworkInfo): string {
    const [imageUrl, setImageUrl] = useState(() => getInitialArtworkImageUrl(artwork));

    useEffect(() => {
        let cancelled = false;

        void resolveArtworkDisplayUrl(artwork).then(resolvedUrl => {
            if (!cancelled) {
                setImageUrl(resolvedUrl);
            }
        });

        return () => {
            cancelled = true;
        };
    }, [artwork.assetId, artwork.imageUrl]);

    return imageUrl;
}

function getInitialArtworkImageUrl(artwork: ArtworkInfo): string {
    if (
        artwork.imageUrl.startsWith("blob:")
        || artwork.imageUrl.startsWith("data:")
        || artwork.imageUrl.startsWith("http://")
        || artwork.imageUrl.startsWith("https://")
    ) {
        return artwork.imageUrl;
    }

    return artwork.imageUrl || MISSING_ARTWORK_DATA_URL;
}

export function FabricArtworkMaterial(props: FabricArtworkMaterialProps) {
    return <FabricArtworkMaterialInner {...props} />;
}

function FabricFaceMaterialWithArtwork({
    artwork,
    fabric,
    isLuminous,
    side = FrontSide
}: {
    artwork: ArtworkInfo;
    fabric: FabricInfo;
    isLuminous: boolean;
    side?: Side;
}) {
    const imageUrl = useResolvedArtworkImageUrl(artwork);

    return (
        <FabricArtworkMaterialInner
            imageUrl={imageUrl}
            isBlockout={fabric.isBlockout}
            isLuminous={isLuminous}
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
            <FabricFaceMaterialWithArtwork
                artwork={artwork}
                fabric={fabric}
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
