import { useEffect, useState } from "react";
import { placeholderImageUrl } from "./websiteAssets";

interface WebsiteAssetImageProps {
    localSrc: string | string[];
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
    const sources = Array.isArray(localSrc) ? localSrc : [localSrc];
    const [candidateIndex, setCandidateIndex] = useState(0);
    const [usedFallback, setUsedFallback] = useState(false);

    useEffect(() => {
        setCandidateIndex(0);
        setUsedFallback(false);
    }, [localSrc]);

    const handleError = () => {
        if (usedFallback) {
            return;
        }

        if (candidateIndex < sources.length - 1) {
            setCandidateIndex(current => current + 1);
            return;
        }

        setUsedFallback(true);
    };

    const resolvedSrc = usedFallback
        ? placeholderImageUrl(seed, width, height)
        : sources[candidateIndex] ?? placeholderImageUrl(seed, width, height);

    return (
        <img
            src={resolvedSrc}
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
