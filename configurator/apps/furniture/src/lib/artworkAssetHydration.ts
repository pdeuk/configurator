import type { ArtworkInfo, StandModule } from "../models/ModuleModel";
import {
    assetService,
    MISSING_ARTWORK_DATA_URL
} from "../services/assets";
import { resolveCloudAssetUrl } from "../services/cloud";
import { getFabricSidesForModule, getModuleFabric } from "../utils/fabrics";

export { MISSING_ARTWORK_DATA_URL };

export async function resolveArtworkDisplayUrl(
    artwork: Pick<ArtworkInfo, "assetId" | "imageUrl">
): Promise<string> {
    if (artwork.assetId) {
        const localUrl = await assetService.resolveDisplayUrl(artwork.assetId);

        if (localUrl !== MISSING_ARTWORK_DATA_URL) {
            return localUrl;
        }

        const cloudUrl = await resolveCloudAssetUrl(artwork.assetId);

        if (cloudUrl) {
            return cloudUrl;
        }

        return MISSING_ARTWORK_DATA_URL;
    }

    if (
        artwork.imageUrl.startsWith("blob:")
        || artwork.imageUrl.startsWith("data:")
        || artwork.imageUrl.startsWith("http://")
        || artwork.imageUrl.startsWith("https://")
    ) {
        return artwork.imageUrl;
    }

    return MISSING_ARTWORK_DATA_URL;
}

export async function hydrateArtworkInfo(artwork: ArtworkInfo): Promise<ArtworkInfo> {
    const imageUrl = await resolveArtworkDisplayUrl(artwork);
    const sourceArtwork = artwork.sourceArtwork
        ? {
            ...artwork.sourceArtwork,
            imageUrl: await resolveArtworkDisplayUrl(artwork.sourceArtwork)
        }
        : undefined;

    return {
        ...artwork,
        imageUrl,
        ...(sourceArtwork ? { sourceArtwork } : {})
    };
}

async function hydrateModuleArtwork(module: StandModule): Promise<StandModule> {
    const nextModule: StandModule = {
        ...module,
        fabrics: module.fabrics ? { ...module.fabrics } : {}
    };

    if (nextModule.artwork) {
        nextModule.artwork = await hydrateArtworkInfo(nextModule.artwork);
    }

    for (const side of getFabricSidesForModule(nextModule)) {
        const fabric = getModuleFabric(nextModule, side);

        if (!fabric.artwork) {
            continue;
        }

        nextModule.fabrics = {
            ...nextModule.fabrics,
            [side]: {
                ...fabric,
                artwork: await hydrateArtworkInfo(fabric.artwork)
            }
        };
    }

    return nextModule;
}

export async function hydrateModulesArtwork(
    modulesById: Record<StandModule["id"], StandModule>
): Promise<Record<StandModule["id"], StandModule>> {
    const entries = await Promise.all(
        Object.entries(modulesById).map(async ([moduleId, module]) => [
            moduleId,
            await hydrateModuleArtwork(module)
        ] as const)
    );

    return Object.fromEntries(entries);
}
