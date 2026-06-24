import { AdditiveBlending, FrontSide } from "three";

export const PLAIN_FABRIC_COLOR = "#d8d2c4";
/** Cool daylight LED backlight — separate from the printed face. */
export const GLOW_COLOR = "#e8f4ff";
export const GLOW_OPACITY = 0.88;
export const GLOW_BLOOM_OPACITY = 0.48;
export const GLOW_BLOOM_SCALE = 1.08;
export const LUMINOUS_GLOW_OFFSET = 0.004;
export const LUMINOUS_BLOOM_OFFSET = 0.012;
export const LUMINOUS_RECT_LIGHT_INTENSITY = 7;
export const PLAIN_LUMINOUS_EMISSIVE_INTENSITY = 2.1;
/** Artwork at rest — accurate hues, no scene-light wash or faux glow. */
export const ARTWORK_RESTING_COLOR = "#737373";
/** Artwork when luminous backlight is on — full print brightness. */
export const ARTWORK_LUMINOUS_COLOR = "#ffffff";
export const BLOCKOUT_ARTWORK_COLOR = "#e5e0d2";
export const BLOCKOUT_BACKING_OFFSET = 0.003;
export const BLOCKOUT_BACKING_COLOR = "#0a0a0a";
export const LUMINOUS_FABRIC_RENDER_ORDER = 2;
export const LUMINOUS_BACK_GLOW_RENDER_ORDER = -2;
export const LUMINOUS_BLOOM_GLOW_RENDER_ORDER = -1;
export const BLOCKOUT_BACKING_RENDER_ORDER = -1;

export function getFabricCoreGlowMaterialProps() {
    return {
        color: GLOW_COLOR,
        transparent: true,
        opacity: GLOW_OPACITY,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        // Face the fabric (+Z); culled from the back of the panel.
        side: FrontSide
    } as const;
}

export function getFabricBloomGlowMaterialProps() {
    return {
        color: GLOW_COLOR,
        transparent: true,
        opacity: GLOW_BLOOM_OPACITY,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: FrontSide
    } as const;
}

export function getFabricFaceGlowMaterialProps() {
    return {
        color: GLOW_COLOR,
        transparent: true,
        opacity: GLOW_OPACITY * 0.65,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        side: FrontSide
    } as const;
}
