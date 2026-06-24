import { BLOCKOUT_FABRIC_COLOR } from "./fabrics";

export interface ComposedMockupImage {
    imageUrl: string;
    pixelWidth: number;
    pixelHeight: number;
}

const MOCKUP_PIXELS_PER_CM = 10;

function getBlockoutPixelDimensions(printWidthCm: number, printHeightCm: number) {
    return {
        width: Math.max(1, Math.round(printWidthCm * MOCKUP_PIXELS_PER_CM)),
        height: Math.max(1, Math.round(printHeightCm * MOCKUP_PIXELS_PER_CM))
    };
}

export function createSolidBlockoutMockup(
    printWidthCm: number,
    printHeightCm: number
): ComposedMockupImage {
    const { width, height } = getBlockoutPixelDimensions(printWidthCm, printHeightCm);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");

    if (!context) {
        throw new Error("Unable to create block-out mock-up.");
    }

    context.fillStyle = BLOCKOUT_FABRIC_COLOR;
    context.fillRect(0, 0, width, height);

    return {
        imageUrl: canvas.toDataURL("image/png"),
        pixelWidth: width,
        pixelHeight: height
    };
}

async function loadImageElement(url: string): Promise<HTMLImageElement> {
    const image = new Image();
    image.src = url;
    await image.decode();

    return image;
}

export { loadImageElement };
