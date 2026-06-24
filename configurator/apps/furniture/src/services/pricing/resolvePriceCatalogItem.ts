import type { BOMLine } from "../bom/BOMModel";
import type { PriceCatalogItemId } from "./PricingModel";

export function resolvePriceCatalogItemId(bomLine: BOMLine): PriceCatalogItemId | null {
    if (bomLine.category === "fabric") {
        if (bomLine.name.includes("Blockout")) {
            return "fabric-blockout";
        }

        if (bomLine.name.includes("Luminous")) {
            return "fabric-luminous";
        }

        return "fabric-standard";
    }

    if (bomLine.category === "panel") {
        return "cube-frame";
    }

    if (bomLine.category === "melamine") {
        return "melamine";
    }

    if (bomLine.category === "shelf") {
        return "shelf";
    }

    if (bomLine.category === "door") {
        return "door";
    }

    if (bomLine.category === "banner") {
        return "banner-frame";
    }

    if (bomLine.category === "frame") {
        if (bomLine.name.includes("Promo Stand")) {
            return "promo-stand-frame";
        }

        return "wall-frame";
    }

    return null;
}
