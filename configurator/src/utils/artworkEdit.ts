import { MIN_PRINT_DPI } from "./fabrics";
import { PLAIN_FABRIC_COLOR } from "../scene/fabricLuminous";
import type { ArtworkInfo } from "../models/ModuleModel";
import { resolveArtworkDisplayUrl } from "../lib/artworkAssetHydration";

export interface ArtworkCropRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface ArtworkEditState {
    rotation: number;
    crop: ArtworkCropRect;
    scaleX: number;
    scaleY: number;
    preserveAspectRatio: boolean;
}

export const DEFAULT_ARTWORK_EDIT_STATE: ArtworkEditState = {
    rotation: 0,
    crop: {
        x: 0,
        y: 0,
        width: 1,
        height: 1
    },
    scaleX: 1,
    scaleY: 1,
    preserveAspectRatio: true
};

export function getArtworkEditOutputDimensions(
    printWidthMeters: number,
    printHeightMeters: number
) {
    const printWidthInches = printWidthMeters / 0.0254;
    const printHeightInches = printHeightMeters / 0.0254;

    return {
        width: Math.max(1, Math.round(printWidthInches * MIN_PRINT_DPI)),
        height: Math.max(1, Math.round(printHeightInches * MIN_PRINT_DPI))
    };
}

const PREVIEW_MAX_DIMENSION = 1200;

export function getArtworkEditPreviewDimensions(
    printWidthMeters: number,
    printHeightMeters: number
) {
    const output = getArtworkEditOutputDimensions(printWidthMeters, printHeightMeters);
    const scale = PREVIEW_MAX_DIMENSION / Math.max(output.width, output.height);

    if (scale >= 1) {
        return output;
    }

    return {
        width: Math.max(1, Math.round(output.width * scale)),
        height: Math.max(1, Math.round(output.height * scale))
    };
}

export async function loadArtworkImage(imageUrl: string): Promise<HTMLImageElement> {
    if (imageUrl.startsWith("data:") || imageUrl.startsWith("blob:")) {
        try {
            const response = await fetch(imageUrl);

            if (!response.ok) {
                throw new Error("Unable to fetch artwork image.");
            }

            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);

            try {
                return await loadImageElement(blobUrl);
            } finally {
                URL.revokeObjectURL(blobUrl);
            }
        } catch {
            return loadImageElement(imageUrl);
        }
    }

    return loadImageElement(imageUrl);
}

export async function loadArtworkInfoImage(artwork: ArtworkInfo): Promise<HTMLImageElement> {
    const imageUrl = await resolveArtworkDisplayUrl(
        artwork.sourceArtwork ?? artwork
    );

    return loadArtworkImage(imageUrl);
}

function loadImageElement(imageUrl: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("Unable to load artwork image."));
        image.src = imageUrl;
    });
}

export function revokeArtworkImageUrl(imageUrl: string | null | undefined) {
    if (imageUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(imageUrl);
    }
}

function normalizeRotation(rotation: number) {
    const normalized = ((rotation % 360) + 360) % 360;

    return normalized === 270 ? 270 : normalized === 180 ? 180 : normalized === 90 ? 90 : 0;
}

function rotateImageToCanvas(image: HTMLImageElement, rotation: number) {
    const normalized = normalizeRotation(rotation);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to rotate artwork.");
    }

    if (normalized === 0) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context.drawImage(image, 0, 0);
        return canvas;
    }

    if (normalized === 180) {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        context.translate(canvas.width, canvas.height);
        context.rotate(Math.PI);
        context.drawImage(image, 0, 0);
        return canvas;
    }

    canvas.width = image.naturalHeight;
    canvas.height = image.naturalWidth;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((normalized * Math.PI) / 180);
    context.drawImage(image, -image.naturalWidth / 2, -image.naturalHeight / 2);

    return canvas;
}

function clampCrop(crop: ArtworkCropRect): ArtworkCropRect {
    const width = Math.min(Math.max(crop.width, 0.05), 1);
    const height = Math.min(Math.max(crop.height, 0.05), 1);
    const x = Math.min(Math.max(crop.x, 0), 1 - width);
    const y = Math.min(Math.max(crop.y, 0), 1 - height);

    return { x, y, width, height };
}

export function renderEditedArtworkToCanvas(
    image: HTMLImageElement,
    state: ArtworkEditState,
    outputWidth: number,
    outputHeight: number
) {
    const rotated = rotateImageToCanvas(image, state.rotation);
    const crop = clampCrop(state.crop);
    const sourceX = Math.round(crop.x * rotated.width);
    const sourceY = Math.round(crop.y * rotated.height);
    const sourceWidth = Math.max(1, Math.round(crop.width * rotated.width));
    const sourceHeight = Math.max(1, Math.round(crop.height * rotated.height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to render edited artwork.");
    }

    canvas.width = outputWidth;
    canvas.height = outputHeight;
    context.fillStyle = PLAIN_FABRIC_COLOR;
    context.fillRect(0, 0, outputWidth, outputHeight);

    const scaleX = state.preserveAspectRatio
        ? Math.min(state.scaleX, state.scaleY)
        : state.scaleX;
    const scaleY = state.preserveAspectRatio
        ? Math.min(state.scaleX, state.scaleY)
        : state.scaleY;
    const drawWidth = outputWidth * scaleX;
    const drawHeight = outputHeight * scaleY;
    const drawX = (outputWidth - drawWidth) / 2;
    const drawY = (outputHeight - drawHeight) / 2;

    context.drawImage(
        rotated,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        drawX,
        drawY,
        drawWidth,
        drawHeight
    );

    return canvas;
}

export function rotateArtworkEditState(state: ArtworkEditState, degrees = 90): ArtworkEditState {
    return {
        ...state,
        rotation: state.rotation + degrees
    };
}

export function updateArtworkEditScale(
    state: ArtworkEditState,
    axis: "x" | "y",
    value: number
) {
    if (state.preserveAspectRatio) {
        return {
            ...state,
            scaleX: value,
            scaleY: value
        };
    }

    return axis === "x"
        ? { ...state, scaleX: value }
        : { ...state, scaleY: value };
}
