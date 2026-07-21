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

        // Fall through to a baked remote URL (e.g. a signed share URL) when the
        // asset cannot be resolved by id on this device — important for shared
        // links opened anonymously or on another device.
    }

    if (
        artwork.imageUrl.startsWith("http://")
        || artwork.imageUrl.startsWith("https://")
    ) {
        return artwork.imageUrl;
    }

    // blob:/data: URLs are only valid in the session that created them, so they
    // are only trustworthy when there is no asset id to resolve through stores.
    if (
        !artwork.assetId
        && (artwork.imageUrl.startsWith("blob:") || artwork.imageUrl.startsWith("data:"))
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
