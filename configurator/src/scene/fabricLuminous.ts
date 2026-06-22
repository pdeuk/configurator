import { DoubleSide, FrontSide } from "three";

export const PLAIN_FABRIC_COLOR = "#d8d2c4";
export const GLOW_COLOR = "#ffe9c8";
export const GLOW_OPACITY = 0.26;
export const LUMINOUS_GLOW_OFFSET = 0.002;
export const LUMINOUS_EMISSIVE_INTENSITY = 0.28;
export const LUMINOUS_TRANSMISSION = 0.32;
export const PLAIN_LUMINOUS_EMISSIVE_INTENSITY = 0.35;
export const PLAIN_LUMINOUS_TRANSMISSION = 0.4;
export const BLOCKOUT_ARTWORK_COLOR = "#e5e0d2";
export const BLOCKOUT_BACKING_OFFSET = 0.003;
export const BLOCKOUT_BACKING_COLOR = "#14120f";
export const LUMINOUS_FABRIC_RENDER_ORDER = 2;
export const LUMINOUS_BACK_GLOW_RENDER_ORDER = 1;
export const LUMINOUS_FACE_GLOW_RENDER_ORDER = 3;
export const BLOCKOUT_BACKING_RENDER_ORDER = 10;

export function getFabricBackGlowMaterialProps() {
    return {
        color: GLOW_COLOR,
        transparent: true,
        opacity: GLOW_OPACITY,
        toneMapped: false,
        side: DoubleSide
    } as const;
}

export function getFabricFaceGlowMaterialProps() {
    return {
        color: GLOW_COLOR,
        transparent: true,
        opacity: GLOW_OPACITY,
        toneMapped: false,
        side: FrontSide
    } as const;
}
