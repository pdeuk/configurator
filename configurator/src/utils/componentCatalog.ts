import type { StandModule } from "../models/ModuleModel";
import { createDefaultFabrics } from "./fabrics";
import { DEFAULT_BANNER_SEGMENT_COUNT } from "./bannerGeometry";

export type ComponentType =
    | "wall"
    | "cube"
    | "promoStand"
    | "circularBanner"
    | "squareBanner";

export const COMPONENT_OPTIONS: Array<{ id: ComponentType; label: string }> = [
    { id: "wall", label: "Frame (100×200 cm)" },
    { id: "cube", label: "Cube (50×50×50 cm)" },
    { id: "promoStand", label: "Promo stand (100×100×50 cm)" },
    { id: "circularBanner", label: "Hanging banner (circular)" },
    { id: "squareBanner", label: "Hanging banner (square)" }
];

export function createComponentModule(type: ComponentType, moduleCount: number): StandModule {
    switch (type) {
        case "wall":
            return {
                id: `wall-${crypto.randomUUID()}`,
                type: "wall",
                position: {
                    x: moduleCount * 1.25,
                    y: 0,
                    z: 0
                },
                rotation: 0,
                width: 1,
                height: 2,
                depth: 0.05,
                fabrics: createDefaultFabrics("wall")
            };
        case "cube":
            return {
                id: `cube-${crypto.randomUUID()}`,
                type: "cube",
                position: {
                    x: moduleCount * 0.75,
                    y: 0,
                    z: 0.75
                },
                rotation: Math.PI,
                width: 0.5,
                height: 0.5,
                depth: 0.5,
                hasMelamineTop: false,
                fabrics: createDefaultFabrics("cube")
            };
        case "promoStand":
            return {
                id: `promo-stand-${crypto.randomUUID()}`,
                type: "promoStand",
                position: {
                    x: moduleCount * 0.75,
                    y: 0,
                    z: 0.75
                },
                rotation: Math.PI,
                width: 1,
                height: 1,
                depth: 0.5,
                fabrics: createDefaultFabrics("promoStand")
            };
        case "circularBanner":
            return {
                id: `banner-${crypto.randomUUID()}`,
                type: "circularBanner",
                position: {
                    x: moduleCount * 0.9,
                    y: 0,
                    z: 0.9
                },
                rotation: 0,
                width: 3,
                height: 1,
                depth: 0.05,
                segmentCount: DEFAULT_BANNER_SEGMENT_COUNT,
                fabrics: createDefaultFabrics(
                    "circularBanner",
                    DEFAULT_BANNER_SEGMENT_COUNT
                )
            };
        case "squareBanner":
            return {
                id: `square-banner-${crypto.randomUUID()}`,
                type: "squareBanner",
                position: {
                    x: moduleCount * 0.9,
                    y: 0,
                    z: 0.9
                },
                rotation: 0,
                width: 3,
                height: 1,
                depth: 0.05,
                segmentCount: DEFAULT_BANNER_SEGMENT_COUNT,
                fabrics: createDefaultFabrics(
                    "squareBanner",
                    DEFAULT_BANNER_SEGMENT_COUNT
                )
            };
    }
}
