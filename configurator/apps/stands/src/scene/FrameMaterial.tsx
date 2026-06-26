import { useMemo } from "react";
import {
    CanvasTexture,
    RepeatWrapping,
    SRGBColorSpace,
    type ColorRepresentation
} from "three";

/** Brushed-aluminum base tone used for all module frames. */
const ALUMINUM_COLOR = "#d4d7d9";
const TEXTURE_SIZE = 256;

interface AluminumTextures {
    map: CanvasTexture | null;
    roughnessMap: CanvasTexture | null;
    bumpMap: CanvasTexture | null;
}

let aluminumTextures: AluminumTextures | null = null;

function createBrushTexture(
    draw: (ctx: CanvasRenderingContext2D, size: number) => void
): CanvasTexture | null {
    if (typeof document === "undefined") {
        return null;
    }

    const canvas = document.createElement("canvas");
    canvas.width = TEXTURE_SIZE;
    canvas.height = TEXTURE_SIZE;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
        return null;
    }

    draw(ctx, TEXTURE_SIZE);

    const texture = new CanvasTexture(canvas);
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.repeat.set(3, 18);
    texture.needsUpdate = true;

    return texture;
}

function getAluminumTextures(): AluminumTextures {
    if (aluminumTextures) {
        return aluminumTextures;
    }

    // Every stroke spans the full width so the texture tiles seamlessly and
    // never produces vertical seam lines when repeated around the frame.
    const map = createBrushTexture((ctx, size) => {
        ctx.fillStyle = "#dadde0";
        ctx.fillRect(0, 0, size, size);

        for (let y = 0; y < size; y += 1) {
            const alpha = y % 5 === 0 ? 0.16 : 0.06;
            ctx.fillStyle = y % 2 === 0
                ? `rgba(255, 255, 255, ${alpha})`
                : `rgba(96, 100, 106, ${alpha})`;
            ctx.fillRect(0, y, size, 1);
        }
    });

    if (map) {
        map.colorSpace = SRGBColorSpace;
    }

    const roughnessMap = createBrushTexture((ctx, size) => {
        ctx.fillStyle = "#9a9a9a";
        ctx.fillRect(0, 0, size, size);

        for (let y = 0; y < size; y += 1) {
            const value = 118 + ((y * 17) % 55);
            ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
            ctx.fillRect(0, y, size, 1);
        }
    });

    const bumpMap = createBrushTexture((ctx, size) => {
        ctx.fillStyle = "#808080";
        ctx.fillRect(0, 0, size, size);

        for (let y = 0; y < size; y += 1) {
            const value = y % 4 === 0 ? 150 : 115;
            ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
            ctx.fillRect(0, y, size, 1);
        }
    });

    const textures = {
        map,
        roughnessMap,
        bumpMap
    };

    aluminumTextures = textures;

    return textures;
}

/**
 * Brushed aluminum finish: metallic with directional grain and roughness
 * variation, avoiding both mirror gloss and a flat matte look.
 */
interface FrameMaterialProps {
    /**
     * Selection/override color. The default frame tint ("white") is mapped to
     * the aluminum base tone; any other color (e.g. the orange highlight) is
     * kept so selection feedback still works.
     */
    color?: string;
    wireframe?: boolean;
    transparent?: boolean;
    opacity?: number;
}

function resolveColor(color?: string): ColorRepresentation {
    if (!color || color === "white") {
        return ALUMINUM_COLOR;
    }

    return color;
}

export function FrameMaterial({
    color,
    wireframe = false,
    transparent = false,
    opacity = 1
}: FrameMaterialProps) {
    const textures = useMemo(getAluminumTextures, []);

    return (
        <meshStandardMaterial
            color={resolveColor(color)}
            map={textures.map}
            roughnessMap={textures.roughnessMap}
            bumpMap={textures.bumpMap}
            bumpScale={0.006}
            metalness={0.95}
            roughness={0.42}
            envMapIntensity={0.82}
            wireframe={wireframe}
            transparent={transparent}
            opacity={opacity}
        />
    );
}
