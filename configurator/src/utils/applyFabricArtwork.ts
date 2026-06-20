import type { FabricSide, StandModule } from "../models/ModuleModel";
import { getFrameConnectionLayout } from "../scene/frameConnections";
import { createArtworkInfo } from "./artwork";
import {
    formatBannerFabricLabel,
    getActiveFabricPrintDimensions,
    isBannerFabricSide,
    recalculateArtworkDpi
} from "./fabrics";

export function getFabricSideLabel(side: FabricSide) {
    return isBannerFabricSide(side) ? formatBannerFabricLabel(side) : side;
}

export function formatFabricSidesLabel(sides: FabricSide[]) {
    if (sides.length === 0) {
        return "fabric";
    }

    if (sides.length === 1) {
        return getFabricSideLabel(sides[0]!);
    }

    if (sides.length <= 3) {
        return sides.map(side => getFabricSideLabel(side)).join(", ");
    }

    return `${sides.length} fabrics`;
}

export function sanitizeActiveFabricSides(
    sides: FabricSide[],
    validSides: FabricSide[]
): FabricSide[] {
    const filtered = sides.filter(side => validSides.includes(side));

    if (filtered.length > 0) {
        return filtered;
    }

    return validSides[0] ? [validSides[0]] : sides.slice(0, 1);
}

export async function createArtworkAssignmentsForSides(
    file: File,
    module: StandModule,
    sides: FabricSide[],
    modules: StandModule[]
) {
    if (sides.length === 0) {
        return [];
    }

    const connectionLayout = getFrameConnectionLayout(module, modules);
    const mergedWidth = connectionLayout.fabric.width;
    const firstSide = sides[0]!;
    const firstDimensions = getActiveFabricPrintDimensions(
        module,
        firstSide,
        mergedWidth
    );
    const baseArtwork = await createArtworkInfo(
        file,
        firstDimensions.width,
        firstDimensions.height
    );

    return sides.map(side => {
        const dimensions = getActiveFabricPrintDimensions(
            module,
            side,
            mergedWidth
        );
        const sameDimensions =
            dimensions.width === firstDimensions.width &&
            dimensions.height === firstDimensions.height;
        const artwork = sameDimensions
            ? baseArtwork
            : recalculateArtworkDpi(
                baseArtwork,
                dimensions.width,
                dimensions.height
            );

        return { side, artwork };
    });
}
