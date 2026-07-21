import { useState } from "react";
import { placeholderImageUrl } from "./websiteAssets";

interface WebsiteAssetImageProps {
    localSrc: string;
    seed: string;
    alt: string;
    width?: number;
    height?: number;
    style?: import("react").CSSProperties;
    className?: string;
}

export function WebsiteAssetImage({
    localSrc,
    seed,
    alt,
    width = 1200,
    height = 900,
    style,
    className
}: WebsiteAssetImageProps) {
    const [src, setSrc] = useState(localSrc);
    const [usedFallback, setUsedFallback] = useState(false);

    const handleError = () => {
        if (usedFallback) {
            return;
        }

        setUsedFallback(true);
        setSrc(placeholderImageUrl(seed, width, height));
    };

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={handleError}
            style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
                ...style
            }}
        />
    );
}
